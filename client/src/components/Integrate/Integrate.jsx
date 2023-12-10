import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.scss';
import { Button, Typography } from 'antd';
import useNeo4j from '../hooks/useNeo4j';
import InputArea from '../UICus/InputArea';
import Results from '../UICus/Results';
import UserResults from '../UICus/UserResults';

const { Title } = Typography;

function Integrate() {
  const [inputText, setInputText] = useState('');
  const [openieTriples, setOpenIETriples] = useState([]);
  const [nerEntities, setNEREntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const { fetchDataFromNeo4j } = useNeo4j();
  const [neo4jData, setNeo4jData] = useState([]);
  const [isConditionMet, setIsConditionMet] = useState(0)
  const [initialObject, setInitialObject] = useState('')
  const [finalResult, setFinalResult] = useState([])
  const [availableFood, setAvailableFood] = useState([])
  const [unavailableFood, setUnavailableFood] = useState([])
  const [availableLoc, setAvailableLoc] = useState([])
  const [unavailableLoc, setUnavailableLoc] = useState([])

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
      // if (shouldApplyTransformation(translateResponse.data.translatedText)) {
      //   transformedText = transformInput(translateResponse.data.translatedText);
      // }
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

  // const shouldApplyTransformation = (text) => {
  //   const words = text.split(' ');
  //   const isIndex = words.indexOf('is');
  //   return isIndex !== -1 && words.length - isIndex <= 3;
  // };

  // function transformInput(originalInput) {
  //   const parts = originalInput.split(' is ');
  //   if (parts.length !== 2) {
  //     return originalInput;
  //   }
  //   const subject = parts[1].trim();
  //   const remainder = parts[0].trim();
  //   const transformedInput = `${subject} is ${remainder}`;
  //   return transformedInput;
  // }

  const fetchDataFromNeo4jForTriple = async (triple) => {
    const subjectLower = triple.subject ? triple.subject.toLowerCase() : '';
    const objectLower = triple.object ? triple.object.toLowerCase() : '';
    let relation = '';
    if (triple.relation.toLowerCase().includes('food in')) {
      relation = 'food_in';
    } else if (triple.relation.toLowerCase().includes('specialty in')) {
      relation = 'specialty_in';
    } else if (triple.relation.toLowerCase().includes('dish in')) {
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
      const hello = 
      inputText.toLocaleLowerCase().includes('hello') || 
      inputText.toLocaleLowerCase().includes('hi');
  
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

      const about = 
      inputText.toLowerCase().includes('introduce yourself');
  
      const finalResult = [];
      const uniqueRelations = new Set();
      let isConditionMet = 0;
      let initialObject = '';
      let A2F = [];
      let U2F = [];
      let A2L = [];
      let U2L = [];
  
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
        if (inputText.toLowerCase().includes('history')) {
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
          if (inputText.toLowerCase().includes('region')) {
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
        //OpenIE part get initial object
        await Promise.all(
          openieTriples.map(async (triple) => {
            const nerLocationEntity = nerEntities.find((entity) => entity.label === 'LOC');
            if (specialLocation) {
              const specialLocations = ['an giang', 'ha giang', 'ha nam', 'ha tinh', 'ha noi'];
              for (const location of specialLocations) {
                if (inputText.toLowerCase().includes(location)) {
                  initialObject = location.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  break;
                }
              }
            } else if (nerLocationEntity && openieTriples.some((t) => t.object.toLowerCase() === nerLocationEntity.text.toLowerCase())) {
              initialObject = nerLocationEntity.text;
            } else {
              initialObject = triple.object 
            }
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
                  console.log("Food >= 2 detected")
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
          })
        );
      }
      return { finalResult, isConditionMet, initialObject, A2F, U2F, A2L, U2L };
    };

    const fetchData = async () => {
      if (nerEntities.length > 0) {
        try {
          const { finalResult, isConditionMet, initialObject, A2F, U2F, A2L, U2L } = await getFinalResult();
          setIsConditionMet(isConditionMet);
          setInitialObject(initialObject);
          setFinalResult(finalResult)
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
      console.log('Updated neo4jData:', neo4jDataResults, finalResult, isConditionMet, initialObject);
    } catch (error) {
      console.error('Error fetching Neo4j data for final result:', error);
    }
  };  

  const isNeo4jDataEmpty = (data) => {
    return !data || data.length === 0;
  };  
  
  return (
    <div className="app-container">
      <Title level={2}>Integrating Models</Title>
      <InputArea
        inputText={inputText}
        setInputText={setInputText}
        inputError={inputError}
        onInputChange={(e) => setInputText(e.target.value)}
      />
      <div className="Exbutton">
        <Button type="primary" onClick={handleExtractAndAnalyze}>
          Extract and Analyze
        </Button>
      </div>
      <Results
        openieTriples={openieTriples}
        nerEntities={nerEntities}
        finalResult={finalResult}
        neo4jData={neo4jData}
        loading={loading}
      />
      <UserResults 
        neo4jData={neo4jData} 
        isConditionMet={isConditionMet} 
        loading={loading} 
        initialObject={initialObject}
        AF={availableFood} 
        UF={unavailableFood} 
        AL={availableLoc}
        UL={unavailableLoc}
      />
    </div>
  );
}

export default Integrate;
