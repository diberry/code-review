    require('dotenv').config();
    const TextToSpeech = require("./textToSpeech");
    const azure = require('azure-storage');

    const getBlobProperties = async(blobService, container, blobName) => {
        return new Promise((resolve, reject) => {
            try {

                // blob properties
                blobService.getBlobProperties(container, blobName, (err, results)=>{
                    if (err) throw err;
                    console.log(`getBlobProperties - ${JSON.stringify(results)}`);
                    if (results) {
                        console.log(`getBlobProperties - done`);
                        resolve(results);
                    }
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    const ttsToBlob = async (container, text, user, fileName) => {

        try{

            const blobService = azure.createBlobService(process.env.STORAGECONNECTIONSTRING);

            const textToSpeech = new TextToSpeech({
                accessTokenHost: process.env.SPEECHACCESSTOKENHOST,
                ttsHost: process.env.SPEECHRESOURCETTSHOST,
                ttsKey: process.env.SPEECHRESOURCETTSKEY
            });

            const directory = user;
            const transformConfig = {"filenameandpath": fileName};

            const blobName = directory + "/" + (+new Date).toString() + '-' + transformConfig.filenameandpath;

            console.log(container);
            console.log(directory);
            console.log(blobName);
            console.log(process.env.STORAGE_CONNECTIONSTRING);

            // DOCS: https://azure.github.io/azure-storage-node/BlobService.html#createWriteStreamToBlockBlob__anchor
            const writableStream = blobService.createWriteStreamToBlockBlob(container, blobName, { blockIdPrefix: 'block' });

            await textToSpeech.transform(transformConfig, text, writableStream);

            console.log(`N-2 textToSpeech.transform done`);

            await getBlobProperties(blobService, container, blobName);
            console.log(`N-1 blob properties done`);
        
        }catch(err){
            console.log(`function error - ${err}`);
        }

    }
/*
    fn().then(results => {
        console.log("N function done");
    }).catch(err => {
        console.log("function err received");
        console.log(err);
    })
*/

const blockingLoop = async() =>{

    console.log("before loop");

    const items = [
        {text:"this is a test", user: process.env.DIRECTORY,fileName: 'this-is-a-test.mp3'},
        {text:"this is the second test", user: 'samsmith',fileName:'this-is-a-second-test.mp3'},
        {text: "this is the third test", user: 'dontbones', fileName:'this-is-the-third-test.mp3'}
    ];

    for(const item of items){

        console.log("in call - before await");
        await ttsToBlob(process.env.CONTAINER, item.text,item.user,item.fileName);
        console.log("in call - after await");

    }

    console.log("after loop");

}



blockingLoop().then(results => {
    console.log("then");
}).catch(err => {
    console.log("err received");
    console.log(err);
})