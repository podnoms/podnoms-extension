const fs = require('fs');
const ChromeExtension = require('crx');
const path = require('path');

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

// crx.load('extension')
//   .then(() => {
//       crx.loadContents();
//   })
//   .then((archiveBuffer) => {
//     fs.writeFile(`${name}.zip`, archiveBuffer);
//
//     if (!argv.codebase || !existsKey) return;
//     crx.pack(archiveBuffer).then((crxBuffer) => {
//       const updateXML = crx.generateUpdateXML();
//
//       fs.writeFile('update.xml', updateXML);
//       fs.writeFile(`${name}.crx`, crxBuffer);
//     });
//   }).catch(e => console.error('Error compressing output', e));