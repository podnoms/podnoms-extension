process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

require('../config/env');
require('dotenv').config()

const azureStorage = require('azure-storage')
    , blobService = azureStorage.createBlobService()
    , path = require('path')
    , fs = require('fs');
const handleError = (err, res) => {
    console.error('Error uploading to blob storage', err);
};

const containerName = 'external';
const getBlobName = originalName => {
    return `extensions/${path.basename(originalName)}`;
};

module.exports.uploadArtifacts = (...files) => {
    files.forEach(file => {
        const options = {
            contentType: 'application/octet-stream',
            metadata: {fileName: path.basename(file)}
        }
        const rr = fs.createReadStream(file);
        blobService.createBlockBlobFromLocalFile(
            containerName,
            getBlobName(file),
            file,
            options, (error, result, response) => {
                if (error) {
                    handleError(error);
                }
                console.log('success', 'File uploaded to Azure Blob storage.');
            });
    })
};
