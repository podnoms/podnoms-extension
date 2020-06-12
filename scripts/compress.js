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
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
// const crx = new ChromeExtension({
//   appId: argv['app-id'],
//   codebase: argv.codebase,
//   privateKey: existsKey ? fs.readFileSync(keyPath) : null
// });

const crx = new ChromeExtension({
    codebase: 'https://podnoms.com/podnoms.crx',
    privateKey: existsKey ? fs.readFileSync(keyPath) : null
});
const base = `${outputDir}/${name}`;
const prefix = `${base}-${version}`;
console.log('Prefix: ', prefix);

crx.load(path.resolve(__dirname, '../extension'))
    .then(crx => crx.pack())
    .then(crxBuffer => {
        const updateXML = crx.generateUpdateXML();
        fs.promises.writeFile(`${outputDir}/update.xml`, updateXML);
        fs.promises.writeFile(`${base}.crx`, crxBuffer);
        fs.promises.writeFile(`${prefix}.crx`, crxBuffer);
    })
    .then(() => azure.uploadArtifacts(`${outputDir}/update.xml`, `${base}.crx`, `${prefix}.crx`))
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
    shouldExitProgram: true,
}).then((result) => {
    console.log(result);
    if (result['success']) {
        const artifact = result['downloadedFiles'][0];
        fs.copyFile(artifact, `./build/${base}.xpi`, (err) => {
            if (err) throw err;
            console.log(`./build/${base}.xpi was copied to destination.txt`);
        });

        fs.copyFile(artifact, `./build/${prefix}.xpi`, (err) => {
            if (err) throw err;
            console.log(`./build/${prefix}.xpi was copied to destination.txt`);
        });
        fs.unlink(artifact, (r) => console.log('Artifact deleted'));

        console.log('Uploading Firefox artifact', `./build/${base}.xpi`, `./build/${prefix}.xpi`);
        azure.uploadArtifacts(`./build/${base}.xpi`, `./build/${prefix}.xpi`);
    }
});
