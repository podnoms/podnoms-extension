import React from 'react';

const PageFooter = () => {
    return (
        <div className="footer fixed-bottom bg-danger-light">
            <div className="text-center align-middle">
                <div className="content py-20 font-size-sm clearfix">
                    Brought to you with <i className="fa fa-heart fa-beat text-pulse"/> by
                    <a className="font-w600" href="https://podnoms.com" target="_blank">&nbsp;PodNoms</a>
                </div>
            </div>
        </div>
    );
};

export default PageFooter;
