import React, {useState} from 'react';
import './Options.css';
import * as browser from 'webextension-polyfill';

const Options = (props) => {
     const [apiKey, setApiKey] = useState(props.apiKey)

    function saveOptions(){
        browser.storage.sync.set({api_key: apiKey});
    }
    return (
        <main role="main"
              className="container">
            <div className="row">
                <div className="col-sm-12">
                    <div className="block">
                        <div className="block-header block-header-default">
                            <h3 className="block-title">Send 2 PodNoms Settings</h3>
                        </div>
                        <div className="block-content">
                            <form>
                                <div className="form-group row">
                                    <label className="col-12"
                                           htmlFor="api-key">API Key</label>
                                    <div className="col-12">
                                    <textarea className="form-control"
                                              id="api-key"
                                              name="api-key"
                                              rows="6"
                                              value={apiKey}
                                              onChange={e => setApiKey(e.target.value)}
                                              placeholder="You can get this from your profile page on podnoms.com.."/>
                                    </div>
                                </div>
                                <div id="status" value={status}></div>
                                <div className="form-group row">
                                    <div className="col-12">
                                        <button type="submit"
                                                onClick={saveOptions}
                                                className="btn btn-alt-primary">Save
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Options;
