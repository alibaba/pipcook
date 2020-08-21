const test = require('tape');
const utils = require('../../lib/utils');

test('utils.getIndent', t => {
  t.equal(utils.getIndent(['']), 0);
  t.equal(utils.getIndent([' ']), 0);
  t.equal(utils.getIndent([' s']), 1);
  t.equal(utils.getIndent([' s s']), 1);
  t.end();
});
