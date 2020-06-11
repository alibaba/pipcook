module.exports = {
  'env': {
    'node': true,
    'es6': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  'rules': {
    'no-trailing-spaces': 'error',
    'prefer-const': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        'functions': false,
      }
    ],
    'comma-spacing': [
      'error',
      {
        'before': false, 'after': true
      }
    ],
    'indent': [ 'error', 2 ],
    'keyword-spacing': [
      'error', { 'before': true }
    ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'space-infix-ops': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'semi': [ 'error', 'always' ],
    'eol-last': [ 'error', 'always' ],
    'comma-dangle': [ 'error', 'never' ],
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': 'error',
    'no-irregular-whitespace': 'error',
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': [ 'error', { before: true, after: true } ],
    'block-spacing': 'error',
    'brace-style': [ 'error', '1tbs', { allowSingleLine: true } ],
    'comma-style': 'error'
  }
};
