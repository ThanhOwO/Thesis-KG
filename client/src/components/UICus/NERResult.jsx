// NERResults.js
import React from 'react';
import { List, Spin, Typography } from 'antd';
import './styles.scss';

const { Title } = Typography;
const NERResults = ({ nerEntities, loading }) => {
  return (
    <div className="ner-results">
      <Title level={4}>NER Results:</Title>
      {loading ? <Spin className="loading-indicator" style={{ margin: '10px' }} /> : null}
      <List
        dataSource={nerEntities}
        renderItem={(entity, index) => (
          <List.Item>
            <span className="entity-text-title"><strong>Text:</strong></span> {entity.text}{' '}
            <span className="entity-label-title"><strong>Label:</strong></span> {entity.label}
          </List.Item>
        )}
      />
    </div>
  );
};

export default NERResults;
