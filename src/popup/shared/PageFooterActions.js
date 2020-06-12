import React from 'react';

const PageFooterActions = (props) => {
    return (
        <div className="footer fixed-bottom p-10 bg-primary bg-danger-light">
            <button
                type="button"
                className="btn btn-info btn-block btn-alt-danger"
                onClick={() => props.addPodcast(props.selectedPodcast, props.selectedOption)}>
                <i className="fa fa-upload mr-5"/>Upload to PodNoms
            </button>
        </div>
    );
};

export default PageFooterActions;
