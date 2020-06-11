import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Options from './Options';
import * as browser from 'webextension-polyfill';

browser.storage.sync.get(['api_key']).then(response => {
    ReactDOM.render(<Options apiKey={response.api_key}/>, document.getElementById('root'));
});
