import React from 'react';
import useFact from '../hooks/useFact';

const RelevantResult = ({ urls, originalKeyword, chatbotRes }) => {
  const { data, loading, error } = useFact(urls, originalKeyword, chatbotRes);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !data || !data.web_ranking) {
    return <div>No relevant data available</div>;
  }

  return (
    <div className="relevant-result-container">
      {data.web_ranking.map((item, index) => (
        <div key={index} className="relevant-item">
          <div className="relevant-web">
            <p>
              URL: <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
            </p>
            <p>Relevant Score: {item['relevant score']}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelevantResult;
