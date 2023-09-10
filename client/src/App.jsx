import React, { useState } from 'react';
import axios from 'axios';
import './App.scss';
import { TextField, Button, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';


function App() {
    const [text, setText] = useState('');
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('http://localhost:8080/ner', { text });
            setEntities(response.data);
        } catch (err) {
            setError('An error occurred while analyzing the text.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="title">Named Recognition Entities</div>
            <form onSubmit={handleSubmit}>
                <TextField
                    className="input-text"
                    variant="outlined"
                    label="Enter text for analysis"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button
                    className="analyze-button"
                    type="submit"
                    disabled={loading}
                >
                    Submit
                </Button>
            </form>
            {loading && (
                <div className="loading">
                    <CircularProgress size={40} thickness={4} color="primary" />
                </div>
            )}
            {error && (
                <Typography className="error">
                    An error occurred while analyzing the text.
                </Typography>
            )}
            <div className="result-container">
                <div className="result-title">Result:</div>
                <ul className="entity-list">
                    {entities.map((entity, index) => (
                        <li key={index} className="entity-item">
                            <div className="entity-title">
                                <span className="entity-text-title">Text:</span> {entity.text}
                                <span className="entity-label-title">Label:</span> {entity.label}
                            </div>

                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
