// Results.js
import React from 'react';
import OpenIETriples from './OpenIEResult';
import NERResults from './NERResult';
import FinalResult from './FinalResult';
import Neo4jResults from './Neo4jResult';

const Results = ({ openieTriples, nerEntities, finalResult, neo4jData, loading }) => {
  return (
    <div className="result-container">
      <OpenIETriples openieTriples={openieTriples} loading={loading} />
      <NERResults nerEntities={nerEntities} loading={loading} />
      <FinalResult finalResult={finalResult} loading={loading} />
      <Neo4jResults neo4jData={neo4jData} loading={loading} />
    </div>
  );
};

export default Results;
