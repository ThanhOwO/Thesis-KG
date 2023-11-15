import React, { useState, useEffect } from 'react';
import { Spin, Typography, Modal } from 'antd';
import './styles.scss';
import RelevantResult from './RelevantResult';

const { Title } = Typography;

const UserResults = ({ neo4jData, isConditionMet, loading, initialObject }) => {
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
        const { subject, relation } = neo4jData[0];
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `Yes, this ${subject.name} is the heart and soul of ${initialObject}'s culinary identity.`,
          `Without a doubt, ${subject.name} is a beloved staple in ${initialObject}, enjoyed by locals and visitors alike.`,
          `Undoubtedly, ${subject.name} is an integral part of ${initialObject}'s culinary scene, loved by many.`,
          `Yes, ${subject.name} is a celebrated specialty in ${initialObject}.`
        ] : [
          `Indeed, ${subject.name} is highly popular and widely enjoyed in ${initialObject}. `,
          `Yes, ${subject.name} is highly popular and widely enjoyed in ${initialObject}.`,
          `Yes, ${subject.name} is indeed highly popular and widely enjoyed in ${initialObject}.`,
        ];

        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else if (isConditionMet === 3 && neo4jData && neo4jData.length > 0) {
        const { subject, relation } = neo4jData[0];
        const objectNames = neo4jData.map((data) => data.object.name).join(', ');
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `No, ${subject.name} is not a ${initialObject}'s specialty. ${subject.name} is a traditional and popular dish in Vietnamese cuisine.`,
        ] : [
          `If we talk about dishes like ${subject.name}, it is not only available in ${initialObject}, it can be easily found in many other provines such as: ${objectNames},...`,
        ];

        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else if (isConditionMet === 1 && neo4jData && neo4jData.length > 0) {
        const objectNames = neo4jData.map((data) => data.object.name).join(', ');
        const subjectNames = neo4jData.map((data) => data.subject.name).join(', ');
        const uniqueSubjectNames = Array.from(new Set(neo4jData.map((data) => data.subject.name)));
        const uniqueObjectNames = Array.from(new Set(neo4jData.map((data) => data.object.name)));

        if (uniqueSubjectNames.length === 1) {
          // All subjects are the same, create a response
          const subjectName = uniqueSubjectNames[0];
          const possibleResponses = [
            `${subjectName} is a popular dish in various locations. It's beloved for its unique taste. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames},...`,
            `Known for its deliciousness, ${subjectName} is enjoyed in various places such as: ${objectNames},...`,
            `${subjectName} is a popular dish in Vietnamese cuisine. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames},...`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (uniqueObjectNames.length === 1) {
          // All objects are the same, create a response
          const objectName = uniqueObjectNames[0];
          const possibleResponses = [
            `When it comes to ${objectName}, there are many delicious dishes here such as: ${subjectNames},... Loved in many different places.`,
            `There are many delicious dishes to try in ${objectName}. However, some of the most renowned and beloved dishes in ${objectName} include: ${subjectNames},...`
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        }
      } else if (isConditionMet === 4 && neo4jData && neo4jData.length > 0) {
        const { subject } = neo4jData[0];
        const possibleResponses = subject.temporal
        console.log("HEY! This is user result for temporal question.")
        responseText = possibleResponses;
      } else if (isConditionMet === 5) {
        const possibleResponses = `Hello! How can I help you?`
        responseText = possibleResponses
      } else {
        const possibleResponses = [
          `I can not understand the question. Please try again with specific question about Vietnamese cuisine.`,
          `I can not get any information with your question. Please try again!`,
          `No specific information available. Please try again!`
        ];
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      }

      setUserResponseText(responseText);
    };

    calculateResponseText();
  }, [neo4jData, isConditionMet, initialObject]);

  if (neo4jData && neo4jData.length > 0) {
    const { subject } = neo4jData[0];
    image = subject.image;
    source = subject.sources;
  }

  return (
    <div className="user-results chat-response">
      {loading ? (
        <Spin className="loading-indicator" style={{ margin: '10px' }} />
      ) : (
        <div className="chat-text">
          <p className='botText'>{userResponseText}</p>
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
      )}
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
