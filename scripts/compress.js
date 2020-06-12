const fs = require('fs');
const ChromeExtension = require('crx');
const path = require('path');
const webExt = require('web-ext').default;

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
const prefix = `${outputDir}/${name}-${version}`;
console.log('Prefix: ', prefix);

crx.load(path.resolve(__dirname, '../extension'))
    .then(() => crx.loadContents())
    .then((zip) => fs.promises.writeFile(`${prefix}.zip`, zip));

crx.load(path.resolve(__dirname, '../extension'))
    .then(crx => crx.pack())
    .then(crxBuffer => {
        const updateXML = crx.generateUpdateXML()
        fs.promises.writeFile(`${outputDir}/update.xml`, updateXML);
        fs.promises.writeFile(`${prefix}.crx`, crxBuffer);
    })
    .catch(err => {
        console.error(err);
    });

//do the same for firefox.
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
});
