/* eslint-disable no-undef */

// import axios from 'axios';
import * as browser from 'webextension-polyfill';

require('dotenv').config();

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log('WE HAVE BEEN UPDATED');
    if (changeInfo.status === 'complete') {
        console.log('WE ARE COMPLETE');
        chrome.tabs.sendMessage(tabId, {type: 'getDoc'}, function (doc) {
            console.log(doc);
        });
    }
});

//
// browser.storage.sync.get(['api_key']).then(response => {
//     if (response.api_key) {
//         browser.tabs.getSelected()
//             .then(tab => {
//                 if (tab) {
//                     _checkForAudio(response.api_key, tab);
//                 }
//             }, (error) => console.error(error));
//         chrome.tabs.getSelected(null, function(tab){
//             console.log(tab);
//         });
//     }
// });
//
// function _checkForAudio(apiKey, tab) {
//     if (tab == null) return;
//
//     const url = tab.url;
//     if (url && !url.startsWith('http')) return;
//     const query = `${process.env.REACT_APP_API_SERVER_URL}/urlprocess/validate?url=${url}`;
//     const config = {
//         headers: {
//             'X-Api-Key': apiKey
//         }
//     };
//     axios.get(query, config).then(
//         response => {
//             if (
//                 response &&
//                 response.status === 200 &&
//                 response.data.links &&
//                 response.data.links.length > 0
//             ) {
//                 const count = response.data.links.length;
//                 browser.browserAction.setBadgeText({
//                     text: '' + (count === 0 ? '' : count),
//                     tabId: tabId
//                 });
//             }
//         },
//         error => console.error(error)
//     );
// }
