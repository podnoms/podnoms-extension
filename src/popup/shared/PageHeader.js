import React from 'react';

const PageHeader = () => {
    return (
        <header>
            <div className="block-header bg-danger">
                <h3 className="block-title text-white font-w600">Send 2 PodNoms</h3>
                <div className="block-options">
                    <button type="button"
                            className="btn-block-option">
                        <img src="/img/icon-72x72.png"
                             className="img-circle img-avatar-small" />
                        </button>
                </div>
            </div>
        </header>
    );
};

export default PageHeader;
