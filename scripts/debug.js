const fs = require('fs');
const path = require('path');

const manifestOptions = require('../config/firefox-manifest');
const buildDir = path.resolve(__dirname, '../extension');

fs.readFile(`${buildDir}/manifest.json`, 'utf8', (err, data) => {

    let obj = JSON.parse(data); //now it an object
    obj = Object.assign(obj, manifestOptions.firefoxManifestExtra);
    console.log(obj);
    const json = JSON.stringify(obj); //convert it back to json
    fs.writeFile(`${buildDir}/manifest-firefox.json`, json, 'utf8', () => {
        console.log('WE DID IT!!');
    });
});
