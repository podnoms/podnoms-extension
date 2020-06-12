// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

require('../config/env');
require('dotenv').config();

const fs = require('fs');
const ChromeExtension = require('crx');
const path = require('path');
const webExt = require('web-ext').default;
const zl = require("zip-lib");

const azure = require('./azure.js');


/* eslint import/no-unresolved: 0 */
const argv = require('minimist')(process.argv.slice(2));
const name = require('../package.json').name;
const version = require('../package.json').version;

const keyPath = argv.key || 'key.pem';
const existsKey = fs.existsSync(keyPath);
const outputDir = './build';
const base = `${name}`;
const prefix = `${base}-${version}`;
const buildDir = path.resolve(__dirname, '../extension');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const crx = new ChromeExtension({
    codebase: 'https://podnoms.com/podnoms.crx',
    privateKey: existsKey ? fs.readFileSync(keyPath) : null
});
console.log('Prefix: ', prefix);

crx.load(buildDir)
    .then(crx => crx.pack())
    .then(crxBuffer => {
        const updateXML = crx.generateUpdateXML();
        fs.promises.writeFile(`${outputDir}/update.xml`, updateXML);
        fs.promises.writeFile(`${outputDir}/${base}.crx`, crxBuffer);
        fs.promises.writeFile(`${outputDir}/${prefix}.crx`, crxBuffer);
    })
    .then(() => azure.uploadArtifacts(`${outputDir}/update.xml`, `${outputDir}/${base}.crx`, `${outputDir}/${prefix}.crx`))
    .catch(err => {
        console.error(err);
    });

console.log('Building Edge zip');
zl.archiveFolder(outputDir, `${outputDir}/${prefix}.zip`).then(() => {
    console.log("Created versioned Edge extension");
    fs.copyFile(`${outputDir}/${prefix}.zip`, `${outputDir}/${base}.zip`, (err) => {
        if (err) throw err;
        console.log(`${outputDir}/${prefix}.xpi was copied to base`);
        azure.uploadArtifacts(`${outputDir}/${prefix}.zip`, `${outputDir}/${base}.zip`);
        //need to save this baby for last as it needs an edited manifest
        _buildFirefox();
    });
}, (err) => {
    console.log(err);
});


function _buildFirefox() {
    console.log('Building firefox XPI');
//add the extra firefox schizzle onto the manifest
    fs.readFile(`${buildDir}/manifest.json`, 'utf8', (err, data) => {
        const manifestOptions = require('../config/manifest');

        let obj = JSON.parse(data); //now it an object
        obj = Object.assign(obj, manifestOptions.firefoxManifestExtra);
        console.log(obj);
        const json = JSON.stringify(obj); //convert it back to json
        fs.writeFile(`${buildDir}/manifest.json`, json, 'utf8', () => {
            webExt.cmd.sign({
                sourceDir: buildDir,
                artifactsDir: './build',
                apiKey: process.env.MOZILLA_API_KEY,
                apiSecret: process.env.MOZILLA_API_SECRET
            }, {
                shouldExitProgram: false,
            }).then((result) => {
                console.log(result);
                if (result['success']) {
                    const artifact = result['downloadedFiles'][0];
                    fs.copyFile(artifact, `${outputDir}/${base}.xpi`, (err) => {
                        if (err) throw err;
                        console.log(`${outputDir}/${base}.xpi was copied to destination.txt`);
                    });

                    fs.copyFile(artifact, `${outputDir}/${prefix}.xpi`, (err) => {
                        if (err) throw err;
                        console.log(`${outputDir}/${prefix}.xpi was copied to base`);
                    });
                    fs.unlink(artifact, (r) => console.log('Artifact deleted'));

                    console.log('Uploading Firefox artifact', `${outputDir}/${base}.xpi`, `${outputDir}/${prefix}.xpi`);
                    azure.uploadArtifacts(`${outputDir}/${base}.xpi`, `${outputDir}/${prefix}.xpi`);
                }
            });
        });
    });

}


