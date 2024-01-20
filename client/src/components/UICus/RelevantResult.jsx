import React from 'react';
import useFact from '../hooks/useFact';

const RelevantResult = ({ urls, originalKeyword, chatbotRes }) => {
  const { data, loading, error } = useFact(urls, originalKeyword, chatbotRes);

  if (loading || !data || !data.web_results) {
    return <div>Loading relevant data...</div>;
  }

  if (error || data.web_results.length === 0) {
    return <div>No relevant data available</div>;
  }

  return (
    <div className="relevant-result-container">
      {data.web_results.map((item, index) => (
        <div key={index} className="relevant-item">
          <div className="relevant-web">
            <p>
              URL: <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
            </p>
            <p>Relevant Sentence: {item.best_sentence}</p>
            <p>Relevant Score: {item.similarity_score}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelevantResult;
