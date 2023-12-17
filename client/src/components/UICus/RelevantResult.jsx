import React from 'react';
import useFact from '../hooks/useFact';

const RelevantResult = ({urls, keywords}) => {

  const { data, loading, error } = useFact(urls, keywords);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return;
  }

  return (
    <div className="relevant-result-container">
      {data.map((item, index) => (
        <div key={index} className="relevant-item">
          <div className="relevant-title">{item.title}</div>
          <div className="relevant-sentences">{item.relevant_sentences.join('. ')}</div>
        </div>
      ))}
    </div>
  );
};

export default RelevantResult;
