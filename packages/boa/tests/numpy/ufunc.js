

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
const { _len, _tuple } = boa.builtins();

test('the ndarry constructor', t => {
  console.log(`${np.typecodes['All']}`);
  t.end();
});