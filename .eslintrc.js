module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
      'no-var': "error",
      '@typescript-eslint/consistent-type-definitions': [
          "error",
          "interface"
      ]  
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
  },
}