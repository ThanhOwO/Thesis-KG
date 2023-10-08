import React, { useState, useEffect } from 'react';
import { Spin, Typography, Modal } from 'antd';
import './styles.scss';

const { Title } = Typography;

const UserResults = ({ neo4jData, isConditionMet, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [userResponseText, setUserResponseText] = useState('');

  let image = null;
  let source = null;

  useEffect(() => {
    const calculateResponseText = () => {
      let responseText = '';

      if (isConditionMet && neo4jData && neo4jData.length > 0) {
        const { subject, object, relation } = neo4jData[0];
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `Yes, this ${subject.name} is the heart and soul of ${object.name}'s culinary identity.`,
          `Without a doubt, ${subject.name} is a beloved staple in ${object.name}, enjoyed by locals and visitors alike.`,
          `Undoubtedly, ${subject.name} is an integral part of ${object.name}'s culinary scene, loved by many.`,
          `Yes, ${subject.name} is a celebrated specialty in ${object.name}.`
        ] : [
          `Indeed, ${subject.name} is highly popular and widely enjoyed in ${object.name}. `,
          `Yes, ${subject.name} is highly popular and widely enjoyed in ${object.name}.`,
          `Yes, ${subject.name} is indeed highly popular and widely enjoyed in ${object.name}.`,
        ];

        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else {
        responseText = 'No specific information available from Neo4j.';
      }

      setUserResponseText(responseText);
    };

    calculateResponseText();
  }, [neo4jData, isConditionMet]);

  if (neo4jData && neo4jData.length > 0) {
    const { subject } = neo4jData[0];
    image = subject.image;
    source = subject.sources;
  }

  return (
    <div className="user-results chat-response">
      <Title level={4}>User Results:</Title>
      {loading ? <Spin className="loading-indicator" style={{ margin: '10px' }} /> : null}
      <div className="chat-text">
        <p>{userResponseText}</p>
        {image && (
          <img
            src={image}
            alt="Food"
            onClick={() => {
              setModalImage(image);
              setModalVisible(true);
            }}
            className="clickable-image"
          />
        )}
        {source && <p>Source: <a href={source} target="_blank" rel="noopener noreferrer">{source}</a></p>}
      </div>
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
        width={900}
      >
        {modalImage && <img src={modalImage} alt="Food" style={{ width: '100%' }} />}
      </Modal>
    </div>
  );
};

export default UserResults;
