import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.scss';
import { Button } from 'antd';
import useNeo4j from '../hooks/useNeo4j';
import UserResults from '../UICus/UserResults';
import { gptlogo, addBtn, saved, rocket, userIcon, gptImgLogo, sendBtn, msgIcon, home, whiteSend } from '../../assets';


function IntegrateUI() {
  const [inputText, setInputText] = useState('');
  const [openieTriples, setOpenIETriples] = useState([]);
  const [nerEntities, setNEREntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const { fetchDataFromNeo4j } = useNeo4j();
  const [neo4jData, setNeo4jData] = useState([]);
  const [userInputText, setUserInputText] = useState('');
  const [chat, setChat] = useState([]);

  const handleExtractAndAnalyze = async () => {
    if (inputText.trim() === '') {
      setInputError(true);
      setTimeout(() => {
        setInputError(false);
      }, 5000);
      return;
    }
    setInputError(false);
    try {
      setLoading(true);

      const translateResponse = await axios.post('http://localhost:8080/translate', {
        text: inputText,
      });
      let transformedText = translateResponse.data.translatedText;
      if (shouldApplyTransformation(translateResponse.data.translatedText)) {
        transformedText = transformInput(translateResponse.data.translatedText);
      }
      const extractResponse = await axios.post('http://localhost:9000', {
        annotators: 'openie',
        outputFormat: 'json',
        data: transformedText,
      });

      setOpenIETriples(extractResponse.data.sentences[0]?.openie);

      const nerResponse = await axios.post('http://localhost:8080/ner', { text: inputText });
      setNEREntities(nerResponse.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldApplyTransformation = (text) => {
    const words = text.split(' ');
    const isIndex = words.indexOf('is');
    return isIndex !== -1 && words.length - isIndex <= 3;
  };

  function transformInput(originalInput) {
    const parts = originalInput.split(' is ');
    if (parts.length !== 2) {
      return originalInput;
    }
    const subject = parts[1].trim();
    const remainder = parts[0].trim();
    const transformedInput = `${subject} is ${remainder}`;
    return transformedInput;
  }

  const fetchDataFromNeo4jForTriple = async (triple) => {
    const subjectLower = triple.subject ? triple.subject.toLowerCase() : '';
    const objectLower = triple.object ? triple.object.toLowerCase() : '';
    let relation = '';
    if (triple.relation.toLowerCase().includes('food in')) {
      relation = 'food_in';
    } else if (triple.relation.toLowerCase().includes('specialty in')) {
      relation = 'specialty_in';
    }
    try {
      const data = await fetchDataFromNeo4j(subjectLower, objectLower, relation);
      return data;
    } catch (error) {
      console.error('Error processing Neo4j data:', error);
      throw error;
    }
  };

  const getFinalResult = () => {
    const isQueryWhatWhereWhich =
    inputText.toLowerCase().includes('what') ||
    inputText.toLowerCase().includes('where') ||
    inputText.toLowerCase().includes('which');

    const specialLocation = 
    inputText.toLowerCase().includes('an giang') ||
    inputText.toLowerCase().includes('ha giang') ||
    inputText.toLowerCase().includes('ha nam') ||
    inputText.toLowerCase().includes('ha tinh') ||
    inputText.toLowerCase().includes('ha noi');

    const finalResult = [];
    const uniqueRelations = new Set();
    let isConditionMet = 0;
    let initialObject = '';

    const temporalCheck = nerEntities.filter((entity) => entity.label === 'TEMPORAL');
    const foodEntity = nerEntities.find((entity) => entity.label === 'FOOD');

    if (temporalCheck.length > 0) {
      isConditionMet = 4;
      const subject = foodEntity ? foodEntity.text : '';
          const object = '';
          const triple = {
            subject,
            relation: 'food in',
            object,
          };

      const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
      if (!uniqueRelations.has(relationKey)) {
        uniqueRelations.add(relationKey);
        finalResult.push(triple);
      }
    }

    if (isQueryWhatWhereWhich) {
      isConditionMet = 1;
      const relationEntities = nerEntities.filter((entity) => entity.label === 'RELATIONSHIP');
      const foodEntity = nerEntities.find((entity) => entity.label === 'FOOD');
      const locationEntity = nerEntities.find((entity) => entity.label === 'LOCATION');

      if (relationEntities.length > 0) {
        relationEntities.forEach( async (relationEntity) => {
          if ((foodEntity && relationEntity) || (locationEntity && relationEntity)) {
            const subject = foodEntity ? foodEntity.text : ''
            const object = locationEntity ? locationEntity.text : ''
            const triple = {
              subject,
              relation: relationEntity.text,
              object,
            };
            const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
            if (!uniqueRelations.has(relationKey)) {
              uniqueRelations.add(relationKey);
              finalResult.push(triple);
            }
          } else {
            console.log("Can't detect any relation");
          }
        });
      } else if (foodEntity || locationEntity) {
          const subject = foodEntity ? foodEntity.text : '';
          const object = locationEntity ? locationEntity.text : '';
          const triple = {
            subject,
            relation: 'food in',
            object,
          };

          const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
          if (!uniqueRelations.has(relationKey)) {
            uniqueRelations.add(relationKey);
            finalResult.push(triple);
          }
        } else {
          console.log("Can't detect any relation");
        }
    } else if (!inputText) {
      return { finalResult: [], isConditionMet: 404, initialObject: '' };
    } else {
      openieTriples.forEach(async (triple) => {
        nerEntities.forEach(async (entity) => {
          const tripleSubjectLower = triple.subject.toLowerCase();
          const tripleObjectLower = triple.object.toLowerCase();
          const initialNER = nerEntities.find(entity => entity.label === 'LOCATION');
          initialObject = initialNER ? initialNER.text : '';

          const foodMatch = nerEntities.some(
            (entity) =>
              entity.text.toLowerCase() === tripleSubjectLower && entity.label === 'FOOD'
          );
      
          const locationMatch = nerEntities.some(
            (entity) =>
              entity.text.toLowerCase() === tripleObjectLower && entity.label === 'LOCATION'
          );
          
          const relationMatch = entity.label === 'RELATIONSHIP' &&
          (triple.relation.toLowerCase().includes('food in') ||
            triple.relation.toLowerCase().includes('specialty in'));   

          if (specialLocation) {
            const locationEntity = nerEntities.find(entity => entity.label === 'LOCATION');
            if (locationEntity) {
              triple.object = locationEntity.text;
            }
          }
          if (foodMatch && locationMatch && relationMatch) {
            let data = await fetchDataFromNeo4jForTriple(triple)
            if (isNeo4jDataEmpty(data)) {
              triple.object = '';
              isConditionMet = 3;
            }
          } else if (foodMatch && locationMatch) {
            isConditionMet = 2;
            const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
            if (!uniqueRelations.has(relationKey)) {
              uniqueRelations.add(relationKey);
              finalResult.push(triple);
            }
          } else if (foodMatch && relationMatch) {
            isConditionMet = 3;
            const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
            if (!uniqueRelations.has(relationKey)) {
              uniqueRelations.add(relationKey);
              finalResult.push(triple);
            }
          }
        });
      });
    }
    return { finalResult, isConditionMet, initialObject };
  };

  const { finalResult, isConditionMet, initialObject } = getFinalResult();

  const fetchNeo4jDataForFinalResult = async () => {
    const dataPromises = finalResult.map(async (triple) => {
      try {
        const data = await fetchDataFromNeo4jForTriple(triple);
        return data;
      } catch (error) {
        console.error('Error fetching Neo4j data for triple:', triple, error);
        return null;
      }
    });
  
    try {
      const neo4jDataResults = await Promise.all(dataPromises);
      setNeo4jData(neo4jDataResults[0] || neo4jDataResults[1]);
      console.log('Updated neo4jData:', neo4jDataResults);
    } catch (error) {
      console.error('Error fetching Neo4j data for final result:', error);
    }
  };  

  const isNeo4jDataEmpty = (data) => {
    return !data || data.length === 0;
  };  

  useEffect(() => {
    if (openieTriples.length > 0 || nerEntities.length > 0) {
      fetchNeo4jDataForFinalResult();
    }
  }, [openieTriples, nerEntities]);  
  
  //----------------------------------------------------------------UI Part----------------------------------------------------------------------

  useEffect(() => {
    // Trigger handleExtractAndAnalyze when the chat state is updated
    if (chat.length > 0 && chat[chat.length - 1].type === 'user') {
      handleExtractAndAnalyze(chat[chat.length - 1].message);
    }
  }, [chat]);

  const handleSendClick = async () => {
    setInputText(userInputText)
    if (userInputText.trim() !== '') {
      // Update the chat with the user's input
      setChat([...chat, { type: 'user', message: userInputText }]);

      // Reset the user input field
      setUserInputText('');
    }
  };

  return (
    <div className='App'>
      <div className='sideBar'>
          <div className='upperSide'>
            <div className='upperSideTop'><img src={gptlogo} alt='Logo' className='logo'/><span className='brand'>My Chatbot</span></div>
            <button className='midBtn'><img src={addBtn} alt='new chat' className='addBtn'/> New Chat</button>
            <div className='upperSideBottom'>
              <button className='query'><img src={msgIcon} alt='Query'/>Hi chat, I need help</button>
            </div>
          </div>
          <div className='lowerSide'>
            <div className='listItems'><img src={home} alt='' className='listItemsImg'/>Home</div>
            <div className='listItems'><img src={saved} alt='' className='listItemsImg'/>Save</div>
            <div className='listItems'><img src={rocket} alt='' className='listItemsImg'/>Upgrade to Pro</div>
          </div>
      </div>
      <div className='main'>
      <div className='chats'>
        {chat.map((message, index) => (
          <div key={index} className={`chat ${message.type}`}>
            {message.type === 'user' ? (
              <img className='chatImg' src={userIcon} alt='' />
            ) : (
              <img className='chatImg' src={gptImgLogo} alt='' />
            )}
            {message.message}
            
          </div>
        ))}
        <div className='chat bot'>
          <img className='chatImg' src={gptImgLogo} alt='' />
          <UserResults neo4jData={neo4jData} isConditionMet={isConditionMet} loading={loading} initialObject={initialObject}/>
        </div>
      </div>
        <div className='chatFooter'>
          <div className='inp'>
            <input
              type='text'
              placeholder='Send a message...'
              value={userInputText}
              onChange={(e) => setUserInputText(e.target.value)}
              className={inputError ? 'input-error' : ''}
            />
            <Button 
              className='send' 
              onClick={handleSendClick} 
              disabled={userInputText.length === 0}
              style={{ backgroundColor: userInputText.length > 0 ? 'rgb(0, 199, 13)' : 'rgba(0, 0, 0, 0)' }}
            >
              <img src={userInputText.length > 0 ? whiteSend : sendBtn} alt='Send'  />
            </Button>
          </div>
          <p>My Chat can make mistakes. Consider checking important information.</p>
        </div>
      </div>
    </div>
  );
}

export default IntegrateUI;
