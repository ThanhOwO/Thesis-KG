import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.scss';
import { Input, Button, Typography, List, Spin } from 'antd';
import useNeo4j from '../hooks/useNeo4j';
import Neo4jTable from '../utils/datatable';

const { Title } = Typography;

function Integrate() {
  const [inputText, setInputText] = useState('');
  const [openieTriples, setOpenIETriples] = useState<any[]>([]);
  const [nerEntities, setNEREntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const { fetchDataFromNeo4j } = useNeo4j();
  const [neo4jData, setNeo4jData] = useState([]);

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

  const getFinalResult = () => {

    const finalResult = [];
    const uniqueRelations = new Set();
    openieTriples.forEach((triple) => {
      nerEntities.forEach((entity) => {
        const tripleSubjectLower = triple.subject.toLowerCase();
        const tripleObjectLower = triple.object.toLowerCase();

        const foodMatch = nerEntities.some(
          (entity) =>
            entity.text.toLowerCase() === tripleSubjectLower && entity.label === 'FOOD'
        );
    
        const locationMatch = nerEntities.some(
          (entity) =>
            entity.text.toLowerCase() === tripleObjectLower && entity.label === 'LOCATION'
        );
    
        if (foodMatch && locationMatch) {
          const relationKey = `${triple.subject}-${triple.relation}-${triple.object}`;
          if (!uniqueRelations.has(relationKey)) {
            uniqueRelations.add(relationKey);
            finalResult.push(triple);
          }
        }
      });
    });
  
    return finalResult;
  };

  const finalResult = getFinalResult();

  const fetchDataFromNeo4jForTriple = async (triple) => {
    try {
      const data = await fetchDataFromNeo4j(triple.subject, triple.object);
      return data;
    } catch (error) {
      console.error('Error processing Neo4j data:', error);
      throw error;
    }
  };

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
      setNeo4jData(neo4jDataResults[0]);
      console.log('Updated neo4jData:', neo4jDataResults);
    } catch (error) {
      console.error('Error fetching Neo4j data for final result:', error);
    }
  };  

  useEffect(() => {
    if (openieTriples.length > 0 || nerEntities.length > 0) {
      fetchNeo4jDataForFinalResult();
    }
  }, [openieTriples, nerEntities]);  
  

  return (
    <div className="app-container">
      <Title level={2}>Combined OpenIE and NER Analysis</Title>
      <Input.TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text..."
        autoSize={{ minRows: 4 }}
        required
        className={inputError ? 'input-error' : ''}
      />
      {inputError && <p className="error-message">Input is required</p>}
      <div className="Exbutton">
        <Button type="primary" onClick={handleExtractAndAnalyze}>
          Extract and Analyze
        </Button>
      </div>
      <div className="result-container">
        <div className="openie-results">
          <Title level={4}>OpenIE Triples:</Title>
          {loading ? (
          <Spin className="loading-indicator" style={{ margin: '10px' }} />
          ) : null}
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
        <div className="ner-results">
          <Title level={4}>NER Results:</Title>
          {loading ? (
            <Spin className="loading-indicator" style={{ margin: '10px' }} />
          ) : null}
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
        <div className="final-result">
          <Title level={4}>Final Result:</Title>
          {loading ? (
            <Spin className="loading-indicator" style={{ margin: '10px' }} />
          ) : null}
          <List
            dataSource={finalResult}
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
        <div className='neo4j-container'>
          <Title level={4}>Neo4j Result:</Title>
          {loading ? (
            <Spin className="loading-indicator" style={{ margin: '10px' }} />
          ) : null}
          {Array.isArray(neo4jData) && neo4jData.length > 0 ? (
            <List
              dataSource={neo4jData}
              renderItem={(data, index) => (
                <List.Item key={index}>
                  <div>
                    <p><strong>Subject:</strong></p>
                    <p><strong>Type:</strong> {data.subject ? JSON.stringify(data.subject.type) : 'N/A'}</p>
                    <p><strong>Name:</strong> {data.subject ? JSON.stringify(data.subject.name) : 'N/A'}</p>
                    <p><strong>Image:</strong> {data.subject ? JSON.stringify(data.subject.image) : 'N/A'}</p>
                    <p><strong>Sources:</strong> {data.subject ? JSON.stringify(data.subject.sources) : 'N/A'}</p>
                    <p><strong>Object:</strong></p>
                    <p><strong>Type:</strong> {data.object ? JSON.stringify(data.object.type) : 'N/A'}</p>
                    <p><strong>Name:</strong> {data.object ? JSON.stringify(data.object.name) : 'N/A'}</p>
                    <p><strong>Country:</strong> {data.object ? JSON.stringify(data.object.country) : 'N/A'}</p>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <p>No Neo4j data available for this triple.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Integrate;
