import React, {Component} from 'react';
import PageBody from '../shared/PageBody';
import * as browser from 'webextension-polyfill';
import PageHeader from '../shared/PageHeader';
import PageFooterActions from '../shared/PageFooterActions';
import PageFooter from '../shared/PageFooter';
import PageMissing from '../shared/PageMissing';
import PageActivity from '../shared/PageActivity';
import PageInvalidUrl from "../shared/PageInvalidUrl";
import PageAuthExpired from "../shared/PageAuthExpired";

import {cancelAllRequests, addEntry, getPodcasts, parsePage} from '../../services/apiService';

class ResultsForm extends Component {
    config = {}
    state = {
        entryTitle: 'Entry added by browser extension',
        view: 'checking',
        links: [],
        podcasts: [],
        podcastSlug: '',
        entryUrl: '',
        podcastUrl: ''
    }

    constructor(props) {
        super(props);
    }

    setStateToSuccess = (slug) => {
        const url = `${process.env.REACT_APP_WEB_SERVER_URL}/podcasts/${slug}`;
        this.setState({podcastUrl: url, view: 'success'});
    }

    addPodcast = () => {

        const podcast = this.state.podcastSlug;
        const url = this.state.entryUrl;
        const entry = {
            podcastId: podcast,
            sourceUrl: url,
            title: this.state.entryTitle
        };
        addEntry(entry).then((slug) => this.setStateToSuccess(slug));
    }

    componentDidMount() {
        browser.tabs.query(
            {
                active: true,
                currentWindow: true
            }).then(tabs => {
                const url = tabs[0].url;
                if (!url.startsWith('http')) {
                    this.setState({view: 'missing'});
                } else {
                    getPodcasts()
                        .then(result => {
                            if (result.error && result.view){
                                this.setState({view: result.view})
                            }
                            else {
                                this.setState({podcasts: result, url: result.url})
                                parsePage(url)
                                    .then((result) => {
                                        console.log('Results are in');
                                        if (result.error) {
                                            if (result.error.response && result.error.response.status === 401) {
                                                this.setState({view: 'invalidauth', url: result.url});
                                                // browser.storage.sync.remove('api_key')
                                                //     .then(r => this.state.view = 'invalidauth');
                                            } else {
                                                this.setState({view: 'missing', url: result.url});
                                            }
                                        } else {
                                            if (result.links.length !== 0) {

                                            }
                                            this.setState(result);
                                        }
                                    }, (result) => {
                                        console.log('Errors are in', result);
                                        this.setState({view: 'invalidauth', url: result.url});
                                    });
                            }
                        });
                }
            }
        );
    }

    componentWillUnmount() {
        // cancelAllRequests();
    }

    render() {
        return (
            <div className="block block-themed">
                <PageHeader/>
                {(() => {
                    switch (this.state.view) {
                        case ('checking'):
                            return <PageActivity/>;
                        case ('invalidauth'):
                            return <PageAuthExpired/>;
                        case ('invalidurl'):
                            return <PageInvalidUrl/>;
                        case ('missing'):
                            return <PageMissing url={this.state.url}/>;
                        case ('parse'):
                            return <PageBody links={this.state.links} podcasts={this.state.podcasts}
                                             selectedPodcastChanged={p => this.setState({podcastSlug: p})}
                                             selectedEntryChanged={e => this.setState({entryUrl: e})}
                                             addPodcast={this.addPodcast}/>;
                        case 'success':
                            return <div className="block page-wrapper">
                                <div className="block-content block-content-full">
                                    <div className="py-20 text-center">
                                        <div className="mb-20">
                                            <i className="fa fas far fa-thumbs-up fa-4x text-info"/>
                                        </div>
                                        <div className="font-size-h4 font-w600">Success!!</div>
                                        <div className="text-muted">Entry successfully added to podcast</div>
                                        <div className="pt-20">
                                            <a className="btn btn-rounded btn-alt-info"
                                               href={this.state.podcastUrl} target="_blank">
                                                <i className="fa fa-users mr-5"/> Check it out
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>;
                    }
                })()}
                {this.state.view === 'parse' ?
                    <PageFooterActions addPodcast={() => this.addPodcast()}/> :
                    <PageFooter/>
                }
            </div>
        );
    }
}

export default ResultsForm;
