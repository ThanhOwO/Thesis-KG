// OpenIETriples.js
import React from 'react';
import { List, Spin, Typography } from 'antd';
import './styles.scss';

const { Title } = Typography;
const OpenIETriples = ({ openieTriples, loading }) => {
  return (
    <div className="openie-results">
      <Title level={4}>OpenIE Triples:</Title>
      {loading ? <Spin className="loading-indicator" style={{ margin: '10px' }} /> : null}
      <List
        dataSource={openieTriples}
        renderItem={(triple, index) => (
          <List.Item>
            <strong>Confidence:</strong> {triple.confidence}{' '}
            <span className="subject-color"><strong>Subject:</strong></span> {triple.subject} -{' '}
            <span className="relation-color"><strong>Relation:</strong></span> {triple.relation} -{' '}
            <span className="object-color"><strong>Object:</strong></span> {triple.object}
          </List.Item>
        )}
      />
    </div>
  );
};

export default OpenIETriples;
