const test = require('ava');
const utils = require('../../lib/utils');

test('utils.getIndent', t => {
  t.is(utils.getIndent(['']), 0);
  t.is(utils.getIndent([' ']), 0);
  t.is(utils.getIndent([' s']), 1);
  t.is(utils.getIndent([' s s']), 1);
});
