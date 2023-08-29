import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [triples, setTriples] = useState([]);

  const extractOpenIE = async () => {
    try {
      const response = await axios.post('http://localhost:9000', {
        annotators: 'openie',
        outputFormat: 'json',
        data: inputText,
      });
      setTriples(response.data.sentences[0]?.openie);
    } catch (error) {
      console.error('Error extracting OpenIE triples:', error);
    }
  };

  return (
    <div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text..."
      />
      <button onClick={extractOpenIE}>Extract OpenIE Triples</button>
      <div>
        <h2>Extracted Triples:</h2>
        <ul>
          {triples.map((triple, index) => (
            <li key={index}>
              Confidence: {triple.confidence} -&nbsp;
              Subject: {triple.subject} -&nbsp;
              Relation: {triple.relation} -&nbsp;
              Object: {triple.object}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
