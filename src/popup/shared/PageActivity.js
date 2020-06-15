import React from 'react';

const PageActivity = () => {
    return (
        <div className="block-content main-content page-wrapper">
            <div className="block">
                <div className="block block-rounded ribbon ribbon-modern ribbon-primary text-center">
                    <div className="block-content block-content-full">
                        <i className="fa fa-4x fa-sun-o fa-spin text-warning"/>
                    </div>
                    <div className="block-content block-content-full block-content-sm bg-body-light">
                        <div className="font-w600 mb-5">Checking this page for audio</div>
                        <div className="font-size-sm text-muted">Please wait...</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageActivity;
