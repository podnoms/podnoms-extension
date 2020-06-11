import React from 'react';
// import PageHeader from "../shared/PageHeader";
import PageFooter from "../shared/PageFooter";

const SetupRequired = () => {
    return (
        <div className="container-fluid body-content">
            <div className="page-wrapper form-group row">
                <div className="scrumboard-col block block-themed">
                    <div className="block-header bg-danger">
                        <h3 className="block-title font-w600">Setup Required</h3>
                    </div>
                    <div className="block-content block-content-full bg-body-light">
                        <p>
                            You need to visit your profile page
                            <a href="https://podnoms.com/profile" target="_blank"> here</a> and pick yourself
                            up an API key to use this extension.
                        </p>
                        <p>Once you've done that, right click the extension button in the toolbar,
                            select "Options" and paste your API key in there</p>

                    </div>
                </div>
            </div>
            <PageFooter/>
        </div>
    );
};

export default SetupRequired;
