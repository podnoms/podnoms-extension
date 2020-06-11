import React, {useState} from 'react';

const PodcastList = (props) => {
    const [selectedPodcast, setSelectedPodcast] = useState('0');
    return (
        <div className="form-group row">
            <label className="col-12" htmlFor="select-podcast">Select Podcast</label>
            <div className="col-md-9">
                <div className="block block-themed">
                    <select className="form-control" id="select-podcast" name="select-podcast"
                            value={selectedPodcast}
                            onChange={event => {
                                setSelectedPodcast(event.target.value);
                                props.podcastSelected(event.target.value);
                            }}>
                        <option value={'0'}  disabled>Please choose a podcast</option>
                        {props.podcasts.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default PodcastList