import React, {useState} from 'react';
import PodcastList from "./PodcastList";

const PageBody = (props) => {
    const [selectedOption, setSelectedOption] = useState('');

    function setEntrySelectionChanged(value) {
        setSelectedOption(value);
        props.selectedEntryChanged(value);
    }

    return (
        <div className="block-content main-content page-wrapper">
            <PodcastList podcasts={props.podcasts}
                         podcastSelected={e => props.selectedPodcastChanged(e)}/>

            <table className="js-table-checkable table table-hover table-vcenter js-table-checkable-enabled">
                <tbody>
                {props.links === [] ?
                    <h5>No Links</h5> :
                    props.links.map(r => <tr key={r.key}>
                        <td className="text-center" style={{width: 40 + 'px'}}>
                            <label className="css-control css-control-primary css-checkbox">
                                <input type="radio" checked={selectedOption === r.value}
                                       onChange={() => setEntrySelectionChanged(r.value)}
                                       className="css-control-input"/>
                                <span className="css-control-indicator"></span>
                            </label>
                        </td>
                        <td className="d-none d-sm-table-cell font-w600" style={{width: 140 + 'px'}}>{r.key}</td>
                        <td>
                            <audio controls>
                                <source src={r.value}/>
                            </audio>
                            <div className="text-muted mt-5">{r.key}</div>
                        </td>
                        <td className="d-none d-xl-table-cell font-w600 font-size-sm text-muted"
                            style={{width: 120 + 'px'}}>{r.key}
                        </td>
                    </tr>)
                }
                </tbody>
            </table>

        </div>
    );
};

export default PageBody;
