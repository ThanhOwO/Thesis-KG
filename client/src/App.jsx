import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Input, Button, Typography, List, Spin } from 'antd'
import './App.scss'

const { Title, Text } = Typography

function App () {
  const { t } = useTranslation()

  const [inputText, setInputText] = useState('')
  const [triples, setTriples] = useState([])
  const [translatedText, setTranslatedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState(false)

  const handleExtractOpenIE = async () => {
    if (inputText.trim() === '') {
      setInputError(true)
      setTimeout(() => {
        setInputError(false)
      }, 5000)
      return
    }
    setInputError(false)
    try {
      setLoading(true)
      const translateResponse = await axios.post('http://localhost:8080/translate', {
        text: inputText
      })
      let transformedText = translateResponse.data.translatedText
      if (shouldApplyTransformation(translateResponse.data.translatedText)) {
        transformedText = transformInput(translateResponse.data.translatedText)
      }
      const extractResponse = await axios.post('http://localhost:9000', {
        annotators: 'openie',
        outputFormat: 'json',
        data: transformedText
      })

      setTranslatedText(translateResponse.data.translatedText)
      setTriples(extractResponse.data.sentences[0]?.openie)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const shouldApplyTransformation = (text) => {
    const words = text.split(" ")
    const isIndex = words.indexOf('is')
    return isIndex !== -1 && words.length - isIndex <= 3
  }

  function transformInput (originalInput) {
    const parts = originalInput.split(' is ')
    if (parts.length !== 2) {
      return originalInput
    }
    const subject = parts[1].trim()
    const remainder = parts[0].trim()
    const transformedInput = `${subject} is ${remainder}`
    return transformedInput
  }

  return (
    <div className="app-container">
      <Title level={2}>{t('Translate and Extract OpenIE Triples')}</Title>
      <Input.TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={t('Enter text...')}
        autoSize={{ minRows: 4 }}
        required
        className={inputError ? 'input-error' : ''}
      />
      {inputError && <p className="error-message">{t('Input is required')}</p>}
      <div className='Exbutton'>
        <Button type="primary" onClick={handleExtractOpenIE}>
          {t('Extract OpenIE Triples')}
        </Button>
      </div>
      {loading && <Spin className="loading-indicator" style={{ marginLeft: '10px' }} />}
      <div className="result-container">
        <div className="translated-text">
          <Title level={4}>{t('Translated Text Title:')}</Title>
          <Text className='translated_text'>{translatedText}</Text>
        </div>
        <div className="extracted-triples">
          <Title level={4}>{t('Extracted Triples Title:')}</Title>
          <List
            dataSource={triples}
            renderItem={(triple, index) => (
              <List.Item>
                <strong>{t('Confidence:')}</strong> {triple.confidence} {' '}
                <span className="subject-color"> {t('Subject:')} </span> {triple.subject} -{' '}
                <span className="relation-color"> {t('Relation:')}  </span> {triple.relation} -{' '}
                <span className="object-color"> {t('Object:')} </span> {triple.object}
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default App
