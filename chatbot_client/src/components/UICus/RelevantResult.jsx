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

  const filteredWebResults = data.web_results.filter(item => item.similarity_score > 0.0);

  return (
    <div className="relevant-result-container">
      {filteredWebResults.map((item, index) => (
        <div key={index} className="relevant-item">
          <div className="relevant-web">
            <p>
              {`Source${index + 1}:`}{' '}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00bfff' }}
              >
                {item.url}
              </a>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelevantResult;
