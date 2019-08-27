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

    const fn = async () => {

        try{

            const blobService = azure.createBlobService(process.env.STORAGECONNECTIONSTRING);

            const textToSpeech = new TextToSpeech({
                accessTokenHost: process.env.SPEECHACCESSTOKENHOST,
                ttsHost: process.env.SPEECHRESOURCETTSHOST,
                ttsKey: process.env.SPEECHRESOURCETTSKEY
            });

            const userName = "diberry";
            const container = "function-blob-tts";
            const directory = userName;
            const transformConfig = {"filenameandpath": '6-test.mp3'};

            const blobName = directory + "/" + transformConfig.filenameandpath;

            // DOCS: https://azure.github.io/azure-storage-node/BlobService.html#createWriteStreamToBlockBlob__anchor
            const writableStream = blobService.createWriteStreamToBlockBlob(container, blobName, { blockIdPrefix: 'block' });

            await textToSpeech.transform(transformConfig, "This is a brand new world.", writableStream);

            console.log(`N-2 textToSpeech.transform done`);

            await getBlobProperties(blobService, container, blobName);
            console.log(`N-1 blob properties done`);
        
        }catch(err){
            console.log(`function error - ${err}`);
        }

    }

    fn().then(results => {
        console.log("N function done");
    }).catch(err => {
        console.log("function err received");
        console.log(err);
    })
