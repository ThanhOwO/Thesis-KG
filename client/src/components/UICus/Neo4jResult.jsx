// Neo4jResults.js
import React from 'react';
import { List, Spin, Typography } from 'antd';
import './styles.scss';

const { Title } = Typography;
const Neo4jResults = ({ neo4jData, loading }) => {
  return (
    <div className="neo4j-container">
      <Title level={4}>Neo4j Result:</Title>
      {loading ? <Spin className="loading-indicator" style={{ margin: '10px' }} /> : null}
      {Array.isArray(neo4jData) && neo4jData.length > 0 ? (
        <List
          dataSource={neo4jData}
          renderItem={(data, index) => (
            <List.Item key={index}>
              <div>
                <p><strong>Subject:</strong></p>
                <p><strong>Type:</strong> {data?.subject ? JSON.stringify(data?.subject.type) : 'N/A'}</p>
                <p><strong>Name:</strong> {data?.subject ? JSON.stringify(data?.subject.name) : 'N/A'}</p>
                <p><strong>Image:</strong> {data?.subject ? JSON.stringify(data?.subject.image) : 'N/A'}</p>
                <p><strong>Sources:</strong> {data?.subject ? JSON.stringify(data?.subject.sources) : 'N/A'}</p>
                <p><strong>Relation:</strong> {data?.relation ? JSON.stringify(data?.relation) : 'N/A'}</p>
                <p><strong>Object:</strong></p>
                <p><strong>Type:</strong> {data?.object ? JSON.stringify(data?.object.type) : 'N/A'}</p>
                <p><strong>Name:</strong> {data?.object ? JSON.stringify(data?.object.name) : 'N/A'}</p>
                <p><strong>Country:</strong> {data?.object ? JSON.stringify(data?.object.country) : 'N/A'}</p>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <p>No Neo4j data available for this triple.</p>
      )}
    </div>
  );
};

export default Neo4jResults;
