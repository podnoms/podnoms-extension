// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

require('../config/env');
require('dotenv').config();

const fs = require('fs');
const ChromeExtension = require('crx');
const path = require('path');
const webExt = require('web-ext').default;

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

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const crx = new ChromeExtension({
    codebase: 'https://podnoms.com/podnoms.crx',
    privateKey: existsKey ? fs.readFileSync(keyPath) : null
});
console.log('Prefix: ', prefix);

crx.load(path.resolve(__dirname, '../extension'))
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

// do the same for firefox.
console.log('Building firefox XPI');
webExt.cmd.sign({
    sourceDir: './extension',
    artifactsDir: './build',
    apiKey: 'user:16056403:686',
    apiSecret: '35e472f7043f2e4c15997f1758ff99bcbd31b941bf5442be7844c989d2892748'
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
        azure.uploadArtifacts(`${outputDir}/.xpi`, `${outputDir}/${prefix}.xpi`);
    }
});
