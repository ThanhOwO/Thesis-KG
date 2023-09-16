import React, { useState } from 'react';
import axios from 'axios';
import './styles.scss';
import { Input, Button, Typography, List, Spin } from 'antd';

const { Title, Text } = Typography;

function Integrate() {
  const [inputText, setInputText] = useState('');
  const [openieTriples, setOpenIETriples] = useState<any[]>([]);
  const [nerEntities, setNEREntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState(false);

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
    const processedTriples = new Set();
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
    
        if (foodMatch && locationMatch && !processedTriples.has(triple.subject + triple.object)) {
          finalResult.push(triple);
          processedTriples.add(triple.subject + triple.object);
        }
      });
    });
  
    return finalResult;
  };

  const finalResult = getFinalResult();

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
      {loading ? (
        <Spin className="loading-indicator" style={{ marginLeft: '10px' }} />
      ) : null}
      <div className="result-container">
        <div className="openie-results">
          <Title level={4}>OpenIE Triples:</Title>
          <List
            dataSource={openieTriples}
            renderItem={(triple, index) => (
              <List.Item>
                <strong>Confidence:</strong> {triple.confidence}{' '}
                <span className="subject-color">Subject:</span> {triple.subject} -{' '}
                <span className="relation-color">Relation:</span> {triple.relation} -{' '}
                <span className="object-color">Object:</span> {triple.object}
              </List.Item>
            )}
          />
        </div>
        <div className="ner-results">
          <Title level={4}>NER Results:</Title>
          {loading ? (
            <Spin className="loading-indicator" style={{ marginLeft: '10px' }} />
          ) : null}
          <List
            dataSource={nerEntities}
            renderItem={(entity, index) => (
              <List.Item>
                <span className="entity-text-title">Text:</span> {entity.text}{' '}
                <span className="entity-label-title">Label:</span> {entity.label}
              </List.Item>
            )}
          />
        </div>
        <div className="final-result">
          <Title level={4}>Final Result:</Title>
          <List
            dataSource={finalResult}
            renderItem={(triple, index) => (
              <List.Item>
                <strong>Confidence:</strong> {triple.confidence}{' '}
                <span className="subject-color">Subject:</span> {triple.subject} -{' '}
                <span className="relation-color">Relation:</span> {triple.relation} -{' '}
                <span className="object-color">Object:</span> {triple.object}
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default Integrate;
