const items = [
    {text:"this is a test", user: 'diberry',fileName: 'this-is-a-test.mp3'},
    {text:"this is the second test", user: 'samsmith',fileName:'this-is-a-second-test.mp3'},
    {text: "this is the third test", user: 'dontbones', fileName:'this-is-the-third-test.mp3'}
];

require('dotenv').config();
const azure = require('azure-storage');
const rp = require('requestretry');

class TextToSpeech {

    /**
     *
     * @param config - {key:"",endpoint:""}
     */
    constructor(config) {
        this.config = config;
        this.delayMS = 500;
        this.retry = 5;
    }

    // retry request if error or 429 received
    retryStrategy(err, response) {
        let shouldRetry = err || response.statusCode === 429;

        return shouldRetry;
    };

    // Gets an access token.
    async getAccessToken() {
        const options = {
            method: 'POST',
            uri: `https://${this.config.accessTokenHost}/sts/v1.0/issueToken`,
            headers: {
                'Ocp-Apim-Subscription-Key': this.config.ttsKey,
            },
        };
        const response = await rp(options);

        return response.body;
    };
    // Make sure to update User-Agent with the name of your resource.
    // You can also change the voice and output formats. See:
    // https://docs.microsoft.com/azure/cognitive-services/speech-service/language-support#text-to-speech
    /**
     *
     * @param accessToken - good for 10 minutes, used immediately
     * @param transformConfig - ttsConfigs
     * @param text
     * @param writableStream
     */
    async textToSpeech(accessToken, transformConfig, text, writableStream) {
        try {
            transformConfig.selectedVoice = {
                gender: 'female',
                locale: 'en-us',
                code: 'Jessa24KRUS',
            };

            // Create the SSML request.
            let body = `<?xml version="1.0"?><speak version="1.0" xml:lang="en-us"><voice xml:lang="en-us" name="Microsoft Server Speech Text to Speech Voice (${transformConfig.selectedVoice.locale}, ${transformConfig.selectedVoice.code})"><prosody rate="-20.00%">${text}</prosody></voice></speak>`;

            let options = {
                method: 'POST',
                baseUrl: `https://${this.config.ttsHost}/`,
                url: '/cognitiveservices/v1',
                headers: {
                    Authorization: 'Bearer ' + accessToken,
                    'cache-control': 'no-cache',
                    'User-Agent': 'YOUR_RESOURCE_NAME',
                    'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                    'Content-Type': 'application/ssml+xml',
                },
                //timeout: 120000,
                body: body,
                maxAttempts: this.retry,
                retryDelay: this.delayMS,
                retryStrategy: this.retryStrategy,
            };

            // request has binary audio file
            await rp(options)
                .on('response', async (response) => {
                    if (response.statusCode === 200) {
                        writableStream.on('finish', () => {
                            console.log('The end!');
                        });
                        response.pipe(writableStream);
                    } else {
                        throw Error('Response statusCode ' + response.statusCode);
                    }
                })
                .on('error', err => {
                    throw err;
                });
        } catch (err) {
            throw err;
        }
    }

    /**
     *
     * @param transformConfig
     * @param text
     */
    async transform(transformConfig, text, writableStream) {
        try {
            // get token - access token is good for 10 minutes
            const accessToken = await this.getAccessToken();

            // get binary and return in in/out writableStream
            await this.textToSpeech(accessToken, transformConfig, text, writableStream);
        } catch (err) {
            throw err;
        }
    }
}

const ttsToBlob = async (text, userName, fileName) => {

    try{

    const blobService = azure.createBlobService(process.env.STORAGECONNECTIONSTRING);

    const textToSpeech = new TextToSpeech({
        accessTokenHost: process.env.SPEECHACCESSTOKENHOST,
        ttsHost: process.env.SPEECHRESOURCETTSHOST,
        ttsKey: process.env.SPEECHRESOURCETTSKEY
    });

    const container = "function-blob-tts";
    const directory = userName;

    const blobName = directory + "-" + fileName;
    const transformConfig = {"filenameandpath": blobName};

    // DOCS: https://azure.github.io/azure-storage-node/BlobService.html#createWriteStreamToBlockBlob__anchor
    const writableStream = blobService.createWriteStreamToBlockBlob(container, blobName, { blockIdPrefix: 'block' });

    console.log("transform before");

    transformResults = await textToSpeech.transform(transformConfig, text, writableStream);

    console.log("transform after");


    // blob properties
    return blobService.getBlobProperties(container, blobName, (err, results)=>{
        if (err) throw err;
        console.log(results);
        if (results) return results;
    });

    }catch(err){
        console.log(err);
        throw(err);
    }

}

const blockingLoop = async() =>{

    console.log("before loop");

    for(const item of items){

        console.log("in call - before async");
        await ttsToBlob(item.text,item.user,item.fileName);
        console.log("in call - after async");

    }

    console.log("after loop");

}

blockingLoop().then(results => {
    console.log("then");
}).catch(err => {
    console.log("err received");
    console.log(err);
})