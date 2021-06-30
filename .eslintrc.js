module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  plugins: [
    "react"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    browser: true,
    es2021: true,
    mocha: true,
    node: true,
    jest: true,
    protractor: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    'no-fallthrough': 0,
    'valid-jsdoc': [2, { "requireReturn": false }],
    'react/jsx-key': 1,
    'react/jsx-no-undef': 2,
    'react/jsx-uses-react': 2,
    'react/jsx-uses-vars': 2,
    'react/no-deprecated': 2,
    'react/no-string-refs': 0,
    'react/prop-types': 0,
    'react/react-in-jsx-scope': 0
  }
};