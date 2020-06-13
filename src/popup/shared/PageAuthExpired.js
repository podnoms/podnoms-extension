import React from "react";

const PageAuthExpired = () => {
    return <div className="block-content main-content page-wrapper">
        <div className="block">
            <div className="block-content block-content-full">
                <div className="py-20 text-center">
                    <div className="mb-20">
                        <img className="bad-news" src="/img/sad-robot.jpg"/>
                    </div>
                    <div className="font-size-h4 font-w600">Bad news...</div>
                    <div className="text-muted">
                        Your API key is invalid
                    </div>
                    <div className="pt-20">
                        <a className="btn btn-rounded btn-alt-info"
                           href={process.env.REACT_APP_WEB_SERVER_URL + "/profile"}
                           target="_blank">
                            <i className="fa fas fa-rocket mr-5"></i> Pick up a new one
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
export default PageAuthExpired;