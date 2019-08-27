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

            return new Promise((resolve, reject) => {
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

                    const { Transform } = require('stream');

                    const reportProgress = new Transform({
                    transform(chunk, encoding, callback) {
                        process.stdout.write('.');
                        callback(null, chunk);
                    }
                    });

                    // request has binary audio file
                    rp(options)
                    .pipe(reportProgress)
                    .pipe(writableStream)
                    .on('finish', () => {
                        console.log('Done');
                        resolve();
                    });

                    

                } catch (err) {
                    reject(err);
                }
            });
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

                console.log("transform done");
            } catch (err) {
                console.log(`transform error - ${err}`);
                throw err;
            }
        }
    }


    module.exports = TextToSpeech;