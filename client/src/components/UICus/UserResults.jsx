import React, { useState, useEffect } from 'react';
import { Spin, Typography, Modal } from 'antd';
import './styles.scss';
import RelevantResult from './RelevantResult';

const { Title } = Typography;

const UserResults = ({ neo4jData, isConditionMet, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [userResponseText, setUserResponseText] = useState('');
  const hasNeo4jData = neo4jData && neo4jData.length > 0;

  let image = null;
  let source = null;

  useEffect(() => {
    const calculateResponseText = () => {
      let responseText = '';

      if (isConditionMet === 2 && neo4jData && neo4jData.length > 0) {
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
      } else if (isConditionMet === 3 && neo4jData && neo4jData.length > 0) {
        const { subject, relation } = neo4jData[0];
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `Sadly, no, while ${subject.name} is enjoyed in place or region you said but it hasn't taken center stage in the region's culinary story.`,
          `Unfortunately, ${subject.name}, although known locally, is not prominent in the culinary heritage of the place you mentioned.`,
          `Unfortunately, this particular specialty ${subject.name}, while available in place you mentioned, doesn't quite shine as a star in the region's culinary narrative.`,
          `No, ${subject.name} isn't considered a specialty in place or region that you mentioned.`,
        ] : [
          `If we talk about dishes like ${subject.name}, it is not only available where you are, it can be easily found in many other regions such as:`,
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
            alt="${subject.name}"
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
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
        width={900}
      >
        {modalImage && <img src={modalImage} alt="${subject.name}" style={{ width: '100%' }} />}
      </Modal>
      {hasNeo4jData && <RelevantResult urls={neo4jData[0].subject.sources} keywords={neo4jData[0].subject.name} />}
    </div>
  );
};

export default UserResults;
