    require('dotenv').config();
  
    const cogTools = require('cognitive-tools');
    const azureAsPromised = require('azure-storage-as-promised');

    const ttsToBlob = async (container, text, user, audioFileName) => {

        try{

            const blobService = new azureAsPromised.Blob(process.env.STORAGECONNECTIONSTRING);

            const textToSpeech = new cogTools.TextToSpeech({
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
            const writableStream = blobService.getWriteStreamToBlob(container, blobName, { blockIdPrefix: 'block' });

            await textToSpeech.transform(transformConfig, text, writableStream);

            //stream handling
            //writableStream.end();

            console.log(`N-2 textToSpeech.transform done`);

            //await getBlobProperties(blobService, container, blobName);
            //console.log(`N-1 blob properties done`);
        
        }catch(err){
            console.log(`function error - ${err}`);
        }

    }

    const audioFileName = "this-is-a-jest-test.mp3";

    ttsToBlob(process.env.CONTAINER, "this is a test", process.env.DIRECTORY, audioFileName).then(results => {
        console.log("N function done");
    }).catch(err => {
        console.log("function err received");
        console.log(err);
    })

/*
const blockingLoop = async() =>{

    console.log("before loop");

    const items = [
        {text:"this is a test", user: 'diberry',fileName: 'this-is-a-test.mp3'},
        {text:"this is the second test", user: 'samsmith',fileName:'this-is-a-second-test.mp3'},
        {text: "this is the third test", user: 'dontbones', fileName:'this-is-the-third-test.mp3'}
    ];

    for(const item of items){

        console.log("in call - before await");
        await ttsToBlob(item.text,item.user,item.fileName);
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
*/