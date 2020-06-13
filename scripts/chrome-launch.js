#!/usr/bin/env node

const path = require('path');
const chromeLaunch = require('chrome-launch'); // eslint-disable-line import/no-extraneous-dependencies
const profile = '/home/fergalm/dev/podnoms/working/chrome-test-profile/';
const extension = '/home/fergalm/dev/podnoms/podnoms-extension/dev/';
require('colors');

const url = 'https://www.rte.ie/radio1/liveline/podcasts/';

const args = [
    `--user-data-dir=${profile}`,
    `--load-extension=${extension}`
];
console.log(`Args: ${args}`);

chromeLaunch(url, { args });

/*
#!/usr/bin/env node

const path = require('path');
const ChromeLauncher = require('chrome-launcher'); // eslint-disable-line import/no-extraneous-dependencies
const url = 'http://localhost:9999/extension.html';
const dev = path.resolve(__dirname, '..', 'dev');
const newFlags = ChromeLauncher.Launcher.defaultFlags()
    .filter(flag => flag !== '--disable-extensions')
    .concat([
        `--load-extension=${dev}`
    ]);
const profile = '../working/chrome-test-profile';

ChromeLauncher.launch({
    enableExtensions: true,
    startingUrl: url,
    userDataDir: profile,
    chromeFlags: newFlags
}).then(chrome => {
    console.log(`Chrome debugging port running on ${chrome.port}`);
});


 */