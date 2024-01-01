import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './styles.scss';
import { Button } from 'antd';
import useNeo4j from '../hooks/useNeo4j';
import UserResults from '../UICus/UserResults';
import { ClearOutlined } from '@ant-design/icons'
import { food1, food2, food3, food4, food5, userIcon, sendBtn, msgIcon, whiteSend, ToVlogo, ToVlogo2, ToVbg } from '../../assets';
import { isVietnamese } from '../libs/libs';


function IntegrateUI() {
  const [inputText, setInputText] = useState('');
  const [nerEntities, setNEREntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const { fetchDataFromNeo4j } = useNeo4j();
  const [neo4jData, setNeo4jData] = useState([]);
  const [message, setMessage] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConditionMet, setIsConditionMet] = useState(0)
  const [initialObject, setInitialObject] = useState('')
  const msgEnd = useRef(null)
  const images = [food1, food2, food3, food4, food5];
  const [currentImage, setCurrentImage] = useState(0);
  const [availableFood, setAvailableFood] = useState([])
  const [unavailableFood, setUnavailableFood] = useState([])
  const [availableLoc, setAvailableLoc] = useState([])
  const [unavailableLoc, setUnavailableLoc] = useState([])
  const [transformedText, setTransformedText] = useState('')
  const [langDetect, setLangDetect] = useState('')
  const handleEnter = async (e) => {
    if (e.key == 'Enter' && !loading && userInput.trim() !== '') await handleSend()
  }

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
      setTransformedText(transformedText)
      const nerResponse = await axios.post('http://localhost:8080/ner', { text: transformedText });
      setNEREntities(nerResponse.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataFromNeo4jForTriple = async (triple) => {
    const subjectLower = triple.subject ? triple.subject.toLowerCase() : '';
    const objectLower = triple.object ? triple.object.toLowerCase() : '';
    let relation = '';
    if (triple.relation.toLowerCase().includes('food')) {
      relation = 'food_in';
    } else if (triple.relation.toLowerCase().includes('specialty')) {
      relation = 'specialty_in';
    } else if (triple.relation.toLowerCase().includes('dish')) {
      relation = 'dish_in';
    }
    try {
      const data = await fetchDataFromNeo4j(subjectLower, objectLower, relation);
      return data;
    } catch (error) {
      console.error('Error processing Neo4j data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const getFinalResult = async () => {

      const detectedLang = isVietnamese(inputText) ? 'vie' : 'eng';
      setLangDetect(detectedLang);

      const hello = 
      transformedText.toLocaleLowerCase().includes('hello') || 
      transformedText.toLocaleLowerCase().includes('hi');
  
      const isQueryWhatWhereWhich =
      transformedText.toLowerCase().includes('what') ||
      transformedText.toLowerCase().includes('where') ||
      transformedText.toLowerCase().includes('which');

      const about = 
      transformedText.toLowerCase().includes('introduce yourself')
  
      const finalResult = [];
      const uniqueRelations = new Set();
      let isConditionMet = 0;
      let initialObject = '';
      let A2F = [];
      let U2F = [];
      let A2L = [];
      let U2L = [];
      let lang = '';

      const temporalCheck = nerEntities.filter((entity) => entity.label === 'TEMPORAL');
      const foodEntity = nerEntities.find((entity) => entity.label === 'FOOD');
  
      //Temporal question
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
      //Normal question without relationship
      if (!nerEntities.some(entity => entity.label === 'RELATIONSHIP') && temporalCheck.length === 0){
        const nerLocationEntity = (nerEntities.find((entity) => entity.label === 'LOC') || {}).text?.toLowerCase() || '';
        initialObject = nerLocationEntity.text;
        const triple = {
          subject: (nerEntities.find((entity) => entity.label === 'FOOD') || {}).text?.toLowerCase() || '',
          relation: 'food in',
          object: (nerEntities.find((entity) => entity.label === 'LOC') || {}).text?.toLowerCase() || '',
        }
        let data = await fetchDataFromNeo4jForTriple(triple);
        if (isNeo4jDataEmpty(data)) {
          isConditionMet = 3;
          triple.object = '';
          const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
          if (!uniqueRelations.has(relationKey)) {
            uniqueRelations.add(relationKey);
            finalResult.push(triple);
          }
        } else {
          isConditionMet = 2;
          const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
          if (!uniqueRelations.has(relationKey)) {
            uniqueRelations.add(relationKey);
            finalResult.push(triple);
          }
        }
      }
      if (hello) {
        isConditionMet = 5
      }
      if (about) {
        isConditionMet = 6
      }
      //What, where, which question
      if (isQueryWhatWhereWhich) {
        if (transformedText.toLowerCase().includes('history')) {
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
        } else {
          if (transformedText.toLowerCase().includes('region')) {
            isConditionMet = 8;
          } else {
            isConditionMet = 1;
          }
          const relationEntities = nerEntities.filter((entity) => entity.label === 'RELATIONSHIP');
          const foodEntity = nerEntities.find((entity) => entity.label === 'FOOD');
          const locationEntity = nerEntities.find((entity) => entity.label === 'LOC');
    
          if (relationEntities.length > 0) {
            relationEntities.forEach( async (relationEntity) => {
              if ((foodEntity && relationEntity) || (locationEntity && relationEntity)) {
                const subject = foodEntity ? foodEntity.text : ''
                const object = locationEntity ? locationEntity.text : ''
                const triple = {
                  subject,
                  relation: 'specialty in',
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
        }
      //Affirmation question (full triple)
      } else if(temporalCheck.length === 0) {
            const nerLocationEntity = nerEntities.find((entity) => entity.label === 'LOC');
            initialObject = nerLocationEntity.text;
            //NER part
            await Promise.all(
              nerEntities.map(async (entity) => {
                const countFood = nerEntities.filter((entity) => entity.label === 'FOOD');
                const countLocation = nerEntities.filter((entity) => entity.label === 'LOC');         
                if (countFood.length === 1 && countLocation.length === 1) {
                  console.log("First")
                  const newTriple = {
                    subject: (nerEntities.find((entity) => entity.label === 'FOOD') || {}).text?.toLowerCase() || '',
                    relation: (nerEntities.find((entity) => entity.label === 'RELATIONSHIP') || {}).text?.toLowerCase() || '',
                    object: (nerEntities.find((entity) => entity.label === 'LOC') || {}).text?.toLowerCase() || '',
                  };
      
                  let data = await fetchDataFromNeo4jForTriple(newTriple);
                  if (isNeo4jDataEmpty(data)) {
                    isConditionMet = 3;
                    newTriple.object = '';
                    const relationKey = `${newTriple.subject}-${newTriple.relation}-${newTriple.object}`;
                    if (!uniqueRelations.has(relationKey)) {
                      uniqueRelations.add(relationKey);
                      finalResult.push(newTriple);
                    }
                  } else {
                    isConditionMet = 2;
                    const relationKey = `${newTriple.subject}-${newTriple.relation}-${newTriple.object}`;
                    if (!uniqueRelations.has(relationKey)) {
                      uniqueRelations.add(relationKey);
                      finalResult.push(newTriple);
                    }
                  }
                } else if (countFood.length >= 2 && countLocation.length === 1) {
                  isConditionMet = 7;
                  console.log("Food > 2 detected")
                  const foodItems = nerEntities
                    .filter((entity) => entity.label === 'FOOD')
                    .map((foodEntity) => foodEntity.text.toLowerCase());

                  const AF = [];
                  const UF = [];

                  for (const foodItem of foodItems) {
                    const newTriple = {
                      subject: foodItem,
                      relation: (nerEntities.find((entity) => entity.label === 'RELATIONSHIP') || {}).text?.toLowerCase() || '',
                      object: (nerEntities.find((entity) => entity.label === 'LOC') || {}).text?.toLowerCase() || '',
                    };
                
                    let data = await fetchDataFromNeo4jForTriple(newTriple);
                    if (isNeo4jDataEmpty(data)) {
                      UF.push(foodItem);
                    } else {
                      AF.push(foodItem);
                    }
                  }
                  A2F = AF
                  U2F = UF
                  console.log("Available Food:", A2F);
                  console.log("Unavailable Food:", U2F);
                } else if (countFood.length === 1 && countLocation.length >= 2) {
                  isConditionMet = 9;
                  console.log("Location >= 2 detected")
                  const locItems = nerEntities
                    .filter((entity) => entity.label === 'LOC')
                    .map((locEntity) => locEntity.text.toLowerCase());

                  const AL = [];
                  const UL = [];

                  for (const locItem of locItems) {
                    const newTriple = {
                      subject: (nerEntities.find((entity) => entity.label === 'FOOD') || {}).text?.toLowerCase() || '',
                      relation: (nerEntities.find((entity) => entity.label === 'RELATIONSHIP') || {}).text?.toLowerCase() || '',
                      object: locItem,
                    };
                
                    let data = await fetchDataFromNeo4jForTriple(newTriple);
                    if (isNeo4jDataEmpty(data)) {
                      const capitalizedLocItem = locItem.replace(/\b\w/g, (char) => char.toUpperCase());
                      UL.push(capitalizedLocItem);
                    } else {
                      const capitalizedLocItem = locItem.replace(/\b\w/g, (char) => char.toUpperCase());
                      AL.push(capitalizedLocItem);
                    }
                    const secondTriple = {
                      subject: (nerEntities.find((entity) => entity.label === 'FOOD') || {}).text?.toLowerCase() || '',
                      relation: (nerEntities.find((entity) => entity.label === 'RELATIONSHIP') || {}).text?.toLowerCase() || '',
                      object: '',
                    };
                    const relationKey = `${secondTriple.subject}-${secondTriple.relation}-${secondTriple.object}`;
                    if (!uniqueRelations.has(relationKey)) {
                      uniqueRelations.add(relationKey);
                      finalResult.push(secondTriple);
                    }
                  }
                  A2L = AL
                  U2L = UL
                  console.log("Available Location:", A2L);
                  console.log("Unavailable Location:", U2L);
                }
              })
            );
      }
      return { finalResult, isConditionMet, initialObject, A2F, U2F, A2L, U2L, lang };
    };

    const fetchData = async () => {
      if (nerEntities.length > 0) {
        try {
          const { finalResult, isConditionMet, initialObject, A2F, U2F, A2L, U2L  } = await getFinalResult();
          setIsConditionMet(isConditionMet);
          setInitialObject(initialObject);
          fetchNeo4jDataForFinalResult(finalResult);
          setAvailableFood(A2F)
          setUnavailableFood(U2F)
          setAvailableLoc(A2L)
          setUnavailableLoc(U2L)
        } catch (error) {
          console.error('Error fetching final result:', error);
        }
      }
    };

    fetchData()
  }, [nerEntities]);

  const fetchNeo4jDataForFinalResult = async (finalResult) => {
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
      setIsProcessing(true)
    } catch (error) {
      console.error('Error fetching Neo4j data for final result:', error);
    }
  };

  const isNeo4jDataEmpty = (data) => {
    return !data || data.length === 0;
  };  
  
  //----------------------------------------------------------------UI Part----------------------------------------------------------------------

  const handleSend = async () => {
    setInputText(userInput);
    setMessage((prevMessages) => [ 
      ...prevMessages,
      { message: userInput, type: 'user' },
    ]);
    setUserInput('')
  };

  useEffect(() => {
    if (inputText.length > 0) {
      handleExtractAndAnalyze();
    }
  }, [inputText]);  

  useEffect(() => {
    if (isProcessing) {
      setMessage((prevMessages) => [
        ...prevMessages,
        {
          message: {
            neo4jData,
            isConditionMet,
            initialObject,
            loading,
            availableFood,
            unavailableFood,
            availableLoc,
            unavailableLoc
          },
          type: 'bot',
        },
      ]);
      console.log("data",neo4jData, isConditionMet, initialObject)
      setIsProcessing(false);
    }
  }, [isProcessing, neo4jData, isConditionMet, initialObject, loading]);

  useEffect(() => {
    msgEnd.current.scrollIntoView();
  }, [message])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [images]);

  const handleQueryClick = (query) => {
    setUserInput(query);
  };
  return (
    <div className='App'>
      <div className='sideBar'>
          <div className='upperSide'>
            <div className='upperSideTop'><img src={ToVlogo2} alt='Logo' className='logo'/><span className='brand'>ToV Bot</span></div>
            <button className='midBtn' onClick={()=>{window.location.reload()}}><ClearOutlined className='addBtn'/> Clear Chat</button>
            <div className='upperSideBottom'>
              <p>Some example question:</p>
              <Button className='query' onClick={() => handleQueryClick('Introduce yourself.')}>
                <img src={msgIcon} alt='Query' />
                Introduce yourself.
              </Button>
              <Button className='query' onClick={() => handleQueryClick('Where can I find pho?')}>
                <img src={msgIcon} alt='Query' />
                Where can I find pho?
              </Button>
              <Button className='query' onClick={() => handleQueryClick('When did pho originate?')}>
                <img src={msgIcon} alt='Query' />
                When did pho originate?
              </Button>
              <Button className='query' onClick={() => handleQueryClick('Is pho a dish in Nam Dinh?')}>
                <img src={msgIcon} alt='Query' />
                Is pho a dish in Nam Dinh ?
              </Button>
            </div>
          </div>
          <div className='lowerSide'>
            <div className='slideshow-container'>
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Food Image ${index}`}
                  className={`slide ${index === currentImage ? 'active' : ''}`}
                  style={{ transform: `translateX(${-100 * currentImage}%)` }}
                />
              ))}
            </div>
          </div>
      </div>
      <div className='main'>
      <div className='chats'>
        {inputText.length === 0 && (
          <div className='titleBackground'>
            <img className='logobg' src={ToVbg}/>
            <h2>ToV Bot</h2>
            <h3>Support and response for Vietnamese cuisine</h3>
          </div>
        )}
        {message.map((chat, index) => (
          <div key={index}>
            {chat.type === 'user' ? (
              <div className='chat'>
                <img className='chatImg1' src={chat.type === 'user' ? userIcon : ToVlogo} alt='' />
                {chat.message}
              </div>
              ) : (
                <div className='chat bot'>
                  <img className='chatImg2' src={chat.type === 'bot' ? ToVlogo : userIcon} alt='' />
                    <UserResults
                      neo4jData={chat.message.neo4jData}
                      isConditionMet={chat.message.isConditionMet}
                      loading={chat.message.loading}
                      initialObject={chat.message.initialObject}
                      AF={chat.message.availableFood}
                      UF={chat.message.unavailableFood}
                      AL={chat.message.availableLoc}
                      UL={chat.message.unavailableLoc}
                      lang={langDetect}
                    />
                </div>
              )}
        </div>
        ))}
        <div ref={msgEnd}/>
      </div>
        <div className='chatFooter'>
          <div className='inp'>
            <input
              type='text'
              placeholder='Send a message...'
              value={userInput}
              onKeyDown={handleEnter}
              onChange={(e) => setUserInput(e.target.value)}
              className={inputError ? 'input-error' : ''}
            />
          <Button 
            className='send' 
            onClick={handleSend} 
            disabled={userInput.length === 0 || loading}
            style={{ backgroundColor: userInput.length > 0 ? 'rgb(0, 199, 13)' : 'rgba(0, 0, 0, 0)' }}
          >
            {loading ? (
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              <img src={userInput.length > 0 ? whiteSend : sendBtn} alt='Send'  />
            )}
          </Button>
          </div>
          <p>ToV Bot can make mistakes. Consider checking important information.</p>
        </div>
      </div>
    </div>
  );
}

export default IntegrateUI;
