import React, { useState, useEffect } from 'react';
import { Spin, Typography, Modal } from 'antd';
import './styles.scss';
import RelevantResult from './RelevantResult';
import axios from 'axios';

const UserResults = ({ neo4jData, isConditionMet, loading, initialObject, AF, UF }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [userResponseText, setUserResponseText] = useState('');
  const hasNeo4jData = neo4jData && neo4jData.length > 0;

  let image = null;
  let source = null;

  function capitalizeFirstLetterEachWord(str) {
    return str
      ? str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : '';
  }

  useEffect(() => {
    const calculateResponseText = async () => {
      let responseText = '';
      const IO = capitalizeFirstLetterEachWord(initialObject);
      if (isConditionMet === 2 && neo4jData && neo4jData.length > 0) {
        const { subject, relation } = neo4jData[0];
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `Yes, this ${subject.name} is the heart and soul of ${IO}'s culinary identity.`,
          `Without a doubt, ${subject.name} is a beloved staple in ${IO}, enjoyed by locals and visitors alike.`,
          `Undoubtedly, ${subject.name} is an integral part of ${IO}'s culinary scene, loved by many.`,
          `Yes, ${subject.name} is a celebrated specialty in ${IO}.`
        ] : [
          `Indeed, ${subject.name} is highly popular and widely enjoyed in ${IO}. `,
          `Yes, ${subject.name} is highly popular and widely enjoyed in ${IO}.`,
          `Yes, ${subject.name} is indeed highly popular and widely enjoyed in ${IO}.`,
        ];

        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else if (isConditionMet === 3 && neo4jData && neo4jData.length > 0) {
        const { subject, relation } = neo4jData[0];
        const objectNames = neo4jData.map((data) => data.object.name).join(', ');
        const regionName = neo4jData.map((data) => data.object.region_eng_name);
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `No, ${subject.name} is not a ${IO}'s specialty. ${subject.name} is a is a famous dish and specialty of ${objectNames} province in ${regionName}.`,
        ] : [
          `If we talk about dishes like ${subject.name}, it is not only available in ${IO}, it can be easily found in many other provines such as: ${objectNames}.`,
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
            `${subjectName} is a popular dish in various locations. It's beloved for its unique taste. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames}.`,
            `Known for its deliciousness, ${subjectName} is enjoyed in various places such as: ${objectNames}.`,
            `${subjectName} is a popular dish in Vietnamese cuisine. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames}.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (uniqueObjectNames.length === 1) {
          // All objects are the same, create a response
          const objectName = uniqueObjectNames[0];
          const possibleResponses = [
            `When it comes to ${objectName}, there are many delicious dishes here such as: ${subjectNames}. Loved in many different places.`,
            `There are many delicious dishes to try in ${objectName}. However, some of the most renowned and beloved dishes in ${objectName} include: ${subjectNames}.`
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        }
      } else if (isConditionMet === 4 && neo4jData && neo4jData.length > 0) {
        const { subject } = neo4jData[0];
        try {
          const response = await axios.post(
            'http://localhost:8080/translate',
            {
              text: subject.temporal
            }
          );
          const translatedText = response.data.translatedText;
          responseText = translatedText;
        } catch (error) {
          console.error('Translation error:', error);
          responseText = 'An error occurred during translation.';
        }
      } else if (isConditionMet === 5) {
        const possibleResponses = [
          `Hello there! 👋 How can I assist you today?`,
          `Hello! Ready to explore the delicious world of Vietnamese cuisine with me? 😋`,
          `Hi! How can I help you today? Ask me some question about Vietnamese dish.`
        ];
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else if (isConditionMet === 6) {
        const possibleResponses = [
          `I'm your go-to guide for exploring the rich tapestry of Vietnamese cuisine. Ask me anything about the history, locations, and fascinating details of dishes across all 63 provinces in Vietnam, and let's embark on a culinary journey together!`,
        ];
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
      } else if (isConditionMet === 7) {
        if(AF.length === 1 && UF.length === 1) {
          const possibleResponses = [
            `If talking about specialties in ${IO}, ${AF} is a popular specialty dish here. ${UF} is Vietnamese dish and also popular in ${IO} but it not specialties in this province.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (AF.length >= 2 && UF.length === 1) {
          const possibleResponses = [
            `If talking about specialties in ${IO}, ${AF} are popular specialty dish here. ${UF} is Vietnamese dish and also popular in ${IO} but it not specialties in this province.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (AF.length === 1 && UF.length >= 2) {
          const possibleResponses = [
            `If talking about specialties in ${IO}, ${AF} is a popular specialty dish here. ${UF} are Vietnamese dishes and are also popular in ${IO} but they are not specialties in this province.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (AF.length >= 2 && UF.length >= 2) {
          const possibleResponses = [
            `If talking about specialties in ${IO}, ${AF} are popular specialty dishes here. ${UF} are Vietnamese dishes and are also popular in ${IO} but they are not specialties in this province.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (AF.length > 0 && UF.length === 0) {
          const possibleResponses = [
            `Yes, all ${AF} are considered specialties in ${IO}, the capital city of Vietnam. ${IO} is renowned for its diverse and delicious street food scene, and these dishes are among the most iconic and beloved in the region.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        } else if (AF.length === 0 && UF.length > 0) {
          const possibleResponses = [
            `${UF} are actually Vietnamese dishes that are not specifically associated with ${IO}, but they are popular and enjoyed throughout Vietnam. All dishes are part of the rich and diverse Vietnamese culinary tradition.`,
          ];
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
        }
      } else if (isConditionMet === 8 && neo4jData && neo4jData.length > 0) {
        const { subject, object } = neo4jData[0];
        const possibleResponses = [
          `${subject.name} is a specialty of ${object.region_eng_name}. While it has become popular throughout Vietnam and internationally, its roots are in the ${object.region_eng_name}.`,
        ];
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
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
          {source && (
            <p>
              Source: <a href={source} target="_blank" rel="noopener noreferrer">Click here</a>
            </p>
          )}
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
