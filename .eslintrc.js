module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb', 'prettier'],
  env: { es6: true, node: true, jest: true },
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    quotes: 0,
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-await-in-loop': 0,
  },
  settings: {
    'import/core-modules': ['aws-sdk/clients/dynamodb', '@elastic/elasticsearch'],
  },
};
