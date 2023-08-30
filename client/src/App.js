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
      const extractResponse = await axios.post('http://localhost:9000', {
        annotators: 'openie',
        outputFormat: 'json',
        data: translateResponse.data.translatedText
      })

      setTranslatedText(translateResponse.data.translatedText)
      setTriples(extractResponse.data.sentences[0]?.openie)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
                {t('Confidence:')} {triple.confidence} -&nbsp;
                {t('Subject:')} {triple.subject} -&nbsp;
                {t('Relation:')} {triple.relation} -&nbsp;
                {t('Object:')} {triple.object}
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default App
