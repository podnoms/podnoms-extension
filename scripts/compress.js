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
    sourceDir: '/home/fergalm/dev/podnoms/podnoms-extension/build',
    apiKey: 'user:16056403:686',
    apiSecret: '35e472f7043f2e4c15997f1758ff99bcbd31b941bf5442be7844c989d2892748',
}, {
    // These are non CLI related options for each function.
    // You need to specify this one so that your NodeJS application
    // can continue running after web-ext is finished.
    shouldExitProgram: true,
})
    .then((extensionRunner) => {
        // The command has finished. Each command resolves its
        // promise with a different value.
        console.log(extensionRunner);
        // You can do a few things like:
        // extensionRunner.reloadAllExtensions();
        // extensionRunner.exit();
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