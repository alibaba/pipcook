const { eslint } = require('@ice/spec');

eslint.rules['no-undef'] = 'off';
eslint.rules['no-nested-ternary'] = 'off';

module.exports = eslint;
