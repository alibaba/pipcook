const { eslint } = require('@ice/spec');

eslint.rules['no-undef'] = 'off';
eslint.rules['no-nested-ternary'] = 'off';
eslint.rules['react/no-string-refs'] = 'off';
eslint.rules['react/jsx-no-bind'] = 'off';

module.exports = eslint;
