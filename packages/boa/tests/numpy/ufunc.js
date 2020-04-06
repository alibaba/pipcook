

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
// eslint-disable-next-line no-unused-vars
const { len, tuple } = boa.builtins();

test('the ndarry constructor', t => {
  console.log(`${np.typecodes['All']}`);
  t.end();
});