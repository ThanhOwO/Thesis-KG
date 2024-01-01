import React from 'react';
import useFact from '../hooks/useFact';

const RelevantResult = ({ urls, originalKeyword, chatbotRes }) => {
  const { data, loading, error } = useFact(urls, originalKeyword, chatbotRes);

  if (loading || !data || !data.web_ranking) {
    return <div>Loading relevant data...</div>;
  }

  if (error || data.web_ranking.length === 0) {
    return <div>No relevant data available</div>;
  }

  return (
    <div className="relevant-result-container">
      <p>Relevant websites:</p>
      {data.web_ranking.map((item, index) => (
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
