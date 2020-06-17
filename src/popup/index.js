import React from 'react';
import './Popup.css';
import ResultsForm from './components/ResultsForm';
import SetupRequired from './components/SetupRequired';

const Index = (props) => {
    return (
        props.apiKey ?
            <ResultsForm apiKey={props.apiKey}/> :
            <SetupRequired/>
    );
};

export default Index;
