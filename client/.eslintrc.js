module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'standard',
    'plugin:react/recommended'
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'react'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    "no-unused-vars": "error",
    "no-undef": "error",
    "no-underscore-dangle": 0,
    'quotes': 'off',
    'indent': 'off',
    'semi': 'off',
    'no-trailing-spaces': 'off',
    'eol-last': 'off',
  },
}
