import React from "react";

const PageInvalidUrl = () => {
    return (<div className="block-content main-content page-wrapper">
        <div className="block">
            <div className="block-content block-content-full">
                <div className="py-20 text-center">
                    <div className="mb-20">
                        <img className="bad-news" src="/img/sad-robot.jpg"/>
                    </div>
                    <div className="font-size-h4 font-w600">Apologies...</div>
                    <div className="text-muted">We are unable to currently parse audio for this page!</div>
                </div>
            </div>
        </div>
    </div>)
}
export default PageInvalidUrl;