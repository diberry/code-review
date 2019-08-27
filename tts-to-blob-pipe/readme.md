# Cognitive Services to Azure Blob with streams

Take a string, such as `This is a brand new world.`, convert it to an mp3 file with Azure Cognitive Services, then save it to a Azure Storage blob.

## Is this code correct? 

The fn function will be called from a serverless app. It appears that the stream doesn't finish writing to the blob before the function returns to the calling service. 

That doesn't seem the correct tick timing - I think the stream should finish writing before returning to the calling service. 

What is wrong with this code? 

* fn function
* TextToSpeech class
* Both
* Assumption that the stream needs to complete before the function returns 

## How to run

1. Create `.env` from `.env.sample`.
1. Create Azure resources and add keys/connection strings to `.env`:

    * Cognitive Services - speech
    * Azure Storage - blobs

1. Run with `npm start`.

1. Result is:

    ```json
    then
    BlobResult {
      container: 'function-blob-tts',
      name: 'diberry/test.mp3',
      metadata: {},
      lastModified: 'Sun, 25 Aug 2019 13:06:25 GMT',
      creationTime: 'Sun, 25 Aug 2019 12:38:50 GMT',
      etag: '"0x8D7295D08E34C0E"',
      blobType: 'BlockBlob',
      contentLength: '19008',
      serverEncrypted: 'true',
      requestId: 'caa7abc9-701e-00ff-0b47-5b694c000000',
      contentSettings:
       { contentType: 'application/octet-stream',
         contentMD5: 'FN99sCq5XC3DOnAucPHtCA==' },
      lease: { status: 'unlocked', state: 'available' } }
    The end!
    ```

## References

* Azure Blobs [docs](https://azure.github.io/azure-storage-node/BlobService.html#createWriteStreamToBlockBlob__anchor)
* Text to Speech [docs](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/quickstart-nodejs-text-to-speech)