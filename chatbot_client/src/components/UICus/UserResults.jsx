import React, { useState, useEffect } from 'react';
import { Spin, Typography, Modal } from 'antd';
import './styles.scss';
import RelevantResult from './RelevantResult';
import axios from 'axios';

const UserResults = ({ neo4jData, isConditionMet, loading, initialObject, AF, UF, AL, UL, lang }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [userResponseText, setUserResponseText] = useState('');
  const [chatRes, setChatRes] = useState('');
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
      let chatbot_res = '';
      const IO = capitalizeFirstLetterEachWord(initialObject);
      if (isConditionMet === 2 && neo4jData && neo4jData.length > 0) {
        const { subject, relation, object } = neo4jData[0];
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

        const refcheck = relation === 'SPECIALTY_IN' ? [
          `Đúng, ${subject.name} là món ăn truyền thống Việt Nam và là đặc sản ở ${object.name}.`,
        ] : [
          `${subject.name} rất phổ biến và được yêu thích rộng rãi ở ${object.name}.`,
        ];
        
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck
      } else if (isConditionMet === 3 && neo4jData && neo4jData.length > 0) {
        const { subject, relation } = neo4jData[0];
        const objectNames = neo4jData.map((data) => data.object.name).join(', ');
        const uniqueRegionNames = Array.from(new Set(neo4jData.map((data) => data.object.region_eng_name)));
        const regionName = uniqueRegionNames.join(', ');
        const uniqueRegionVnNames = Array.from(new Set(neo4jData.map((data) => data.object.region_name)));
        const vnRegionName = uniqueRegionVnNames.join(', ');
        const uniqueRegionDetail = Array.from(new Set(neo4jData.map((data) => data.object.region_detail)));
        const vnRegionDetail = uniqueRegionDetail.join(', ');
        const uniqueRegionDetailEng = Array.from(new Set(neo4jData.map((data) => data.object.region_eng_detail)));
        const engRegionDetail = uniqueRegionDetailEng.join(', ');
        const possibleResponses = relation === 'SPECIALTY_IN' ? [
          `No, ${subject.name} is not a ${IO}'s specialty. ${subject.name} is a famous dish and specialty of ${objectNames} province in ${regionName}.`,
        ] : [
          `If we talk about dishes like ${subject.name}, it is not only available in ${IO} but also popular in many provinces and cities in region: ${engRegionDetail}.`,
        ];

        const refcheck = relation === 'SPECIALTY_IN' ? [
          `Không, ${subject.name} không phải là đặc sản của ${IO}. ${subject.name} là món ăn, đặc sản nổi tiếng của tỉnh ${objectNames} thuộc miền ${vnRegionName}.`,
        ] : [
          `Nếu nói về những món ăn như ${subject.name} thì không chỉ có ở ${IO} mà còn phổ biến ở nhiều tỉnh thành thuộc miền: ${vnRegionDetail}.`,
        ];

        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck;
      } else if (isConditionMet === 1 && neo4jData && neo4jData.length > 0) {
        const objectNames = neo4jData.map((data) => data.object.name).join(', ');
        const subjectNames = neo4jData.map((data) => data.subject.name).join(', ');
        const uniqueSubjectNames = Array.from(new Set(neo4jData.map((data) => data.subject.name)));
        const uniqueObjectNames = Array.from(new Set(neo4jData.map((data) => data.object.name)));

        if (uniqueSubjectNames.length === 1) {
          // All subjects are the same, create a response
          if (neo4jData.length >= 60){
            console.log("data hon 60")
            const subjectName = uniqueSubjectNames[0];
            const possibleResponses = [
              `${subjectName} is a popular dish throughout Vietnam. It is loved for its unique taste.`,
              `${subjectName} is a popular dish in Vietnamese cuisine and is easily found throughout Vietnam.`,
            ];
            const refcheck = `${subjectName} là món ăn phổ biến ở khắp cả nước Việt Nam. Nó được yêu thích vì hương vị độc đáo của nó.`
            const randomIndex = Math.floor(Math.random() * possibleResponses.length);
            responseText = possibleResponses[randomIndex];
            chatbot_res = refcheck;
          } else {
            const subjectName = uniqueSubjectNames[0];
            const possibleResponses = [
              `${subjectName} is a popular dish in various locations. It's beloved for its unique taste. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames}.`,
              `Known for its deliciousness, ${subjectName} is enjoyed in various places such as: ${objectNames}.`,
              `${subjectName} is a popular dish in Vietnamese cuisine. Some of the best places to eat ${subjectName} in Vietnam include: ${objectNames}.`,
            ];
            const refcheck = `${subjectName} là món ăn phổ biến trong ẩm thực Việt Nam. Một số địa điểm có ${subjectName} ngon tại Việt Nam bao gồm: ${objectNames}.`
            const randomIndex = Math.floor(Math.random() * possibleResponses.length);
            responseText = possibleResponses[randomIndex];
            chatbot_res = refcheck;
          }
        } else if (uniqueObjectNames.length === 1) {
          // All objects are the same, create a response
          const objectName = uniqueObjectNames[0];
          const possibleResponses = [
            `When it comes to ${objectName}, there are many delicious dishes here such as: ${subjectNames}. Loved in many different places.`,
            `There are many delicious dishes to try in ${objectName}. However, some of the most renowned and beloved dishes in ${objectName} include: ${subjectNames}.`
          ];
          const refcheck = `Có rất nhiều món ngon để thử ở ${objectName}. Tuy nhiên, một số món ăn nổi tiếng và được yêu thích nhất ở ${objectName} bao gồm: ${subjectNames}.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
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
          chatbot_res = subject.temporal
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
        const refcheck = [
          `Xin chào! 👋 Hôm nay tôi có thể giúp gì cho bạn?`,
          `Xin chào! Bạn đã sẵn sàng khám phá thế giới ẩm thực Việt Nam hấp dẫn cùng tôi chưa? 😋`,
          `Chào bạn! Hôm nay tôi giúp gì được cho bạn? Cho tôi hỏi một số câu hỏi về món ăn Việt Nam.`
        ];
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        const randomIndex2 = Math.floor(Math.random() * refcheck.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck[randomIndex2];
      } else if (isConditionMet === 6) {
        const possibleResponses = [
          `I'm your go-to guide for exploring the rich tapestry of Vietnamese cuisine. Ask me anything about the history, locations, and fascinating details of dishes across all 63 provinces in Vietnam, and let's embark on a culinary journey together!`,
        ];
        const refcheck = `Tôi là người hướng dẫn giúp bạn khám phá tấm thảm phong phú của ẩm thực Việt Nam. Hãy hỏi tôi bất cứ điều gì về lịch sử, địa điểm và chi tiết hấp dẫn của các món ăn trên khắp 63 tỉnh thành Việt Nam và cùng nhau bắt đầu hành trình ẩm thực!`
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck
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
      } else if (isConditionMet === 9 && neo4jData && neo4jData.length > 0) {
        const { subject } = neo4jData[0];
        if(AL.length === 1 && UL.length === 1) {
          const possibleResponses = [
            `Yes, ${subject.name} is a traditional dish in Vietnamese cuisine including ${AL}. But when talking about specialties, ${UL} is not on that list.`,
          ];
          const refcheck = `Đúng vậy, ${subject.name} là món ăn truyền thống trong ẩm thực Việt Nam, trong đó có ${AL}. Nhưng khi nói về đặc sản thì ${UL} lại không có trong danh sách đó.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        } else if (AL.length >= 2 && UL.length === 1) {
          const possibleResponses = [
            `Yes, ${subject.name} is a traditional dish in Vietnamese cuisine including ${AL}. But when talking about specialties, ${UL} is not on that list.`,
          ];
          const refcheck = `Đúng vậy, ${subject.name} là món ăn truyền thống trong ẩm thực Việt Nam, trong đó có ${AL}. Nhưng khi nói về đặc sản thì ${UL} lại không có trong danh sách đó.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        } else if (AL.length === 1 && UL.length >= 2) {
          const possibleResponses = [
            `Yes, ${subject.name} is a traditional dish in Vietnamese cuisine including ${AL}. But when talking about specialties, ${UL} are not on that list.`,
          ];
          const refcheck = `Đúng vậy, ${subject.name} là món ăn truyền thống trong ẩm thực Việt Nam, trong đó có ${AL}. Nhưng khi nói về đặc sản thì ${UL} lại không có trong danh sách đó.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        } else if (AL.length >= 2 && UL.length >= 2) {
          const possibleResponses = [
            `Yes, ${subject.name} is a traditional dish in Vietnamese cuisine including ${AL}. But when talking about specialties, ${UL} are not on that list.`,
          ];
          const refcheck = `Đúng vậy, ${subject.name} là món ăn truyền thống trong ẩm thực Việt Nam, trong đó có ${AL}. Nhưng khi nói về đặc sản thì ${UL} lại không có trong danh sách đó.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        } else if (AL.length > 0 && UL.length === 0) {
          const possibleResponses = [
            `${subject.name} is a popular Vietnamese dish that is enjoyed throughout the country, including in ${AL}.`,
          ];
          const refcheck = `${subject.name} là món ăn phổ biến của Việt Nam được yêu thích khắp cả nước, kể cả ở ${AL}.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        } else if (AL.length === 0 && UL.length > 0) {
          const possibleResponses = [
            `${subject.name} is a traditional dish in Vietnamese cuisine. But in ${UL}, ${subject.name} is not a specialty of these provinces.`,
          ];
          const refcheck = `${subject.name} là món ăn truyền thống trong ẩm thực Việt Nam. Nhưng ở ${UL}, ${subject.name} không phải là đặc sản của các tỉnh này.`
          const randomIndex = Math.floor(Math.random() * possibleResponses.length);
          responseText = possibleResponses[randomIndex];
          chatbot_res = refcheck;
        }
      } else if (isConditionMet === 8 && neo4jData && neo4jData.length > 0) {
        const { subject, object } = neo4jData[0];
        const possibleResponses = [
          `${subject.name} is a specialty of ${object.region_eng_name}. While it has become popular throughout Vietnam and internationally, its roots are in the ${object.region_eng_name}.`,
        ];
        const refcheck = `${subject.name} là đặc sản ở miền ${object.region_name}. Mặc dù nó đã trở nên phổ biến khắp Việt Nam, nhưng nguồn gốc của nó lại nằm ở ${object.region_name}.`
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck
      } else {
        const possibleResponses = [
          `I can not understand the question. Please try again with specific question about Vietnamese cuisine.`,
          `I can not get any information with your question. Please try again!`,
          `No specific information available. Please try again!`
        ];
        const refcheck = [
          `Tôi không thể hiểu được câu hỏi. Vui lòng thử lại với câu hỏi cụ thể về ẩm thực Việt Nam.`,
          `Tôi không thể nhận được bất kỳ thông tin với câu hỏi của bạn. Vui lòng thử lại!`,
          `Không có thông tin cụ thể có sẵn. Vui lòng thử lại!`
        ]
        const randomIndex = Math.floor(Math.random() * possibleResponses.length);
        const randomIndex2 = Math.floor(Math.random() * refcheck.length);
        responseText = possibleResponses[randomIndex];
        chatbot_res = refcheck[randomIndex2]
      }
      if (lang === 'vie') {
        setUserResponseText(chatbot_res);
      } else if (lang === 'eng') {
        setUserResponseText(responseText);
      }
      setChatRes(chatbot_res);
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
          {hasNeo4jData && <RelevantResult urls={source} originalKeyword={neo4jData[0].subject.name} chatbotRes={chatRes} />}
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
      
    </div>
  );
};

export default UserResults;
