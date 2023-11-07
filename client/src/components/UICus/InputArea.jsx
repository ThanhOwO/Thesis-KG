// InputArea.js
import React from 'react';
import { Input } from 'antd';

const InputArea = ({ inputText, setInputText, inputError, onInputChange }) => {
  return (
    <Input.TextArea
      value={inputText}
      onChange={onInputChange}
      placeholder="Enter text..."
      autoSize={{ minRows: 4 }}
      required
      className={inputError ? 'input-error' : ''}
    />
  );
};

export default InputArea;
