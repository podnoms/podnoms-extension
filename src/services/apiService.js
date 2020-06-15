import axios from 'axios';
import * as browser from "webextension-polyfill";

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const PAGE_PARSE = `${process.env.REACT_APP_API_SERVER_URL}/urlprocess/validate?url=`;
const PODCAST_LIST = `${process.env.REACT_APP_API_SERVER_URL}/pub/browserextension/podcasts`;
const ENTRY_ADD = `${process.env.REACT_APP_API_SERVER_URL}/entry`;

export const cancelAllRequests = () => {
    source.cancel("Cancelling request");
}
const DISALLOWED_HOSTS = [
    "podnoms.local",
    "localhost",
    "podnoms.com",
    "dev.pdnm.be"
];

function _validateUrl(url) {
    try {
        const host = new URL(url);
        if (host.host) {
            return !DISALLOWED_HOSTS.includes(host.hostname.toLowerCase());
        }
    } catch (e) {

    }
    return false
}

function _getConfig(apiKey) {
    return {
        headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json'
        },
        cancelToken: source.token
    }
}

export const addEntry = (entry) => {
    return new Promise((resolve) => {
        browser.storage.sync.get(['api_key']).then(response => {
            if (!response.api_key) {
                resolve({
                    view: 'invalidauth'
                });
            }

            axios.post(ENTRY_ADD, JSON.stringify(entry), _getConfig(response.api_key))
                .then((response) => {
                        if (
                            response &&
                            response.status === 200
                        ) {
                            resolve(response.data.podcastSlug);
                        }
                    }
                );
        });
    });
}

export const parsePage = (url) => {
    return new Promise((resolve) => {
        if (!_validateUrl(url)) {
            resolve({
                url: url,
                links: [],
                view: 'invalidurl'
            });
        }
        browser.storage.sync.get(['api_key']).then(response => {
            if (!response.api_key) {
                resolve({
                    url: url,
                    links: [],
                    view: 'invalidauth'
                });
            }

            axios.get(`${PAGE_PARSE}${url}`, _getConfig(response.api_key)).then(
                response => {
                    if (response && response.status === 200) {
                        resolve({
                            url: url,
                            links: response.data.links,
                            entryTitle: response.data.title,
                            view: response.data.links && response.data.links.length !== 0 ? 'parse' : 'missing'
                        });
                    }
                }, (error) => {
                    resolve({
                        url: url,
                        links: [],
                        view: 'invalidauth',
                        error: error
                    });
                }
            );
        });
    });
}

export const getPodcasts = () => {
    return new Promise((resolve) => {
        browser.storage.sync.get(['api_key']).then(response => {
            if (!response.api_key) {
                resolve({
                    view: 'invalidauth'
                });
            }
            axios.get(PODCAST_LIST, _getConfig(response.api_key)).then(
                response => {
                    if (
                        response &&
                        response.status === 200 &&
                        response.data
                    ) {
                        resolve(response.data);
                    }
                });
        });
    });
}
export const flagPage = (url) => {
    return new Promise((resolve) => {
        browser.storage.sync.get(['api_key']).then(response => {
            if (!response.api_key) {
                resolve({
                    view: 'invalidauth'
                });
            }
            axios.post()
        });
    });
}