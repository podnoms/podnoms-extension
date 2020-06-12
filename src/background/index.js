/* eslint-disable no-undef */

import axios from 'axios';
import * as browser from 'webextension-polyfill';

require('dotenv').config();

browser.tabs.onUpdated.addListener(tabId => {
    // only do this if we decide to revert to page action
    // chrome.pageAction.show(tabId);
    browser.tabs
        .query({
            active: true,
            currentWindow: true
        })
        .then(tabs => {
            browser.storage.sync.get(['api_key']).then(response => {
                if (response.api_key) {
                    _checkForAudio(response.api_key, tabId, tabs[0]);
                }
            });
        });
});

function _checkForAudio(apiKey, tabId, tab) {
    if (tab == null) return;

    const url = tab.url;
    if (url && !url.startsWith('http')) return;
    const query = `${process.env.REACT_APP_API_SERVER_URL}/urlprocess/validate?url=${url}`;
    const config = {
        headers: {
            'X-Api-Key': apiKey
        }
    };
    axios.get(query, config).then(
        response => {
            if (
                response &&
                response.status === 200 &&
                response.links &&
                response.links.length > 0
            ) {
                const count = response.links.length;
                browser.browserAction.setBadgeText({
                    text: '' + (count === 0 ? '' : count),
                    tabId: tabId
                });
            }
        },
        error => console.error(error)
    );
}
