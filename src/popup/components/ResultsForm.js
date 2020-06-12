import React, {Component} from 'react';
import axios from "axios";
import PageBody from "../shared/PageBody";
import * as browser from 'webextension-polyfill';
import PageHeader from "../shared/PageHeader";
import PageFooterActions from "../shared/PageFooterActions";
import PageFooter from "../shared/PageFooter";
import PageMissing from "../shared/PageMissing";
import PageActivity from "../shared/PageActivity";

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const parseQuery = `${process.env.REACT_APP_API_SERVER_URL}/urlprocess/validate?url=`;
const podcastListQuery = `${process.env.REACT_APP_API_SERVER_URL}/pub/browserextension/podcasts`;
const podcastAdd = `${process.env.REACT_APP_API_SERVER_URL}/entry`;


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
        this.config = {
            headers: {
                'X-Api-Key': this.props.apiKey,
                'Content-Type': 'application/json'
            },
            cancelToken: source.token
        };
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
        }
        axios.post(podcastAdd, JSON.stringify(entry), this.config)
            .then((response) => {
                    if (
                        response &&
                        response.status === 200
                    ) {
                        console.log('Setting state', this);
                        this.setStateToSuccess(response.data.podcastSlug)
                    }
                }
            )
    }

    componentDidMount() {

        browser.tabs.query(
            {
                active: true,
                currentWindow: true
            }).then(tabs => {
                const url = tabs[0].url;
                axios.get(`${parseQuery}${url}`, this.config).then(
                    response => {
                        if (response && response.status === 200) {
                            this.setState({
                                links: response.data.links,
                                entryTitle: response.data.title,
                                view: response.data.links && response.data.links.length !== 0 ? 'parse' : 'missing'
                            })
                        }
                    }
                )
                axios.get(podcastListQuery, this.config).then(
                    response => {
                        if (
                            response &&
                            response.status === 200 &&
                            response.data
                        ) {
                            this.setState({podcasts: response.data})
                        }
                    }
                )
            }
        )
    }

    componentWillUnmount() {
        source.cancel('Component unmounted')
    }

    render() {
        return (
            <div className="block block-themed">
                <PageHeader/>
                {(() => {
                    switch (this.state.view) {
                        case ('checking'):
                            return <PageActivity/>
                        case ('missing'):
                            return <PageMissing/>
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
                            </div>
                    }
                })()}
                {this.state.view === 'parse' ?
                    <PageFooterActions addPodcast={() => this.addPodcast()}/> :
                    <PageFooter/>
                }

            </div>
        )
    }
}

export default ResultsForm;
