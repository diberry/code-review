require('dotenv').config();
const TextToSpeech = require("./textToSpeech");
const azure = require('azure-storage');

const fn = async () => {

    const blobService = azure.createBlobService(process.env.STORAGECONNECTIONSTRING);

    const textToSpeech = new TextToSpeech({
        accessTokenHost: process.env.SPEECHACCESSTOKENHOST,
        ttsHost: process.env.SPEECHRESOURCETTSHOST,
        ttsKey: process.env.SPEECHRESOURCETTSKEY
    });

    const userName = "diberry";
    const container = "function-blob-tts";
    const directory = userName;
    const transformConfig = {"filenameandpath": 'test.mp3'};

    const blobName = directory + "/" + transformConfig.filenameandpath;

    // DOCS: https://azure.github.io/azure-storage-node/BlobService.html#createWriteStreamToBlockBlob__anchor
    const writableStream = blobService.createWriteStreamToBlockBlob(container, blobName, { blockIdPrefix: 'block' });

    await textToSpeech.transform(transformConfig, "This is a brand new world.", writableStream);

    // blob properties
    return await blobService.getBlobProperties(container, blobName, (err, results)=>{
        if (err) throw err;
        console.log(results);
        if (results) return results;
    });

}

fn().then(results => {
    console.log("then");
}).catch(err => {
    console.log("err received");
    console.log(err);
})
