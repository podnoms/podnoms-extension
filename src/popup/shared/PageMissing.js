import React from 'react';

const PageMissing = () => {
    return (
        <div className="block-content main-content page-wrapper">
            <div className="block">
                <div className="block-content block-content-full">
                    <div className="py-20 text-center">
                        <div className="mb-20">
                            <i className="fa fas fa-sad-tear fa-4x text-info"/>
                        </div>
                        <div className="font-size-h4 font-w600">Bad news...</div>
                        <div className="text-muted">I could not find any audio on this page!</div>
                        <div className="pt-20">
                            <a className="btn btn-rounded btn-alt-info" href="javascript:void(0)">
                                <i className="fa fas fa-envelope-open-text mr-5"/> Submit URL for checking
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageMissing;
