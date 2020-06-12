/* eslint-disable no-undef */

import axios from 'axios';
import * as browser from 'webextension-polyfill';

require('dotenv').config();
browser.storage.sync.get(['api_key']).then(response => {
    if (response.api_key) {
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                if (tab && tab.url) {
                    _checkForAudio(response.api_key, tab);
                }
            }
        });
    }
});


function _checkForAudio(apiKey, tab) {
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
                response.data.links &&
                response.data.links.length > 0
            ) {
                const count = response.data.links.length;
                browser.browserAction.setBadgeText({
                    text: '' + (count === 0 ? '' : count),
                    tabId: tab.id
                });
            }
        },
        error => console.error(error)
    );
}
