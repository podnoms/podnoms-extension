import React, {useState} from 'react';
import {flagPage} from '../../services/apiService';

const PageMissing = (props) => {
    const [pageStatus, setPageStatus] = useState('info');
    const submitUrlForChecking = (url) => {
        flagPage(url)
            .then((r) => setPageStatus('submitted'))
    }

    return pageStatus === 'info' ? (
        <div className="block-content main-content page-wrapper">
            <div className="block">
                <div className="block-content block-content-full">
                    <div className="py-20 text-center">
                        <div className="mb-20">
                            <img className="bad-news" src="/img/sad-robot.jpg"/>
                        </div>
                        <div className="font-size-h4 font-w600">Bad news...</div>
                        <div className="text-muted">I could not find any audio on this page!</div>
                        <div className="pt-20">
                            <a className="btn btn-rounded btn-alt-info" href="#"
                               onClick={submitUrlForChecking(props.url)}>
                                <i className="fa fas fa-search-plus mr-5"/> Submit URL for checking
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="block-content main-content page-wrapper">
            <div className="block">
                <div className="block-content block-content-full">
                    <div className="py-20 text-center">
                        <div className="mb-20">
                            <img className="bad-news" src="/img/sad-robot.jpg"/>
                        </div>
                        <div className="font-size-h4 font-w600">Thank you...</div>
                        <div className="text-muted">
                            We received your request and
                            will get back to you as soon as we can!
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageMissing;
