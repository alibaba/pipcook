

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
// eslint-disable-next-line no-unused-vars
const { _len, _tuple } = boa.builtins();

test('the dot function', t => {
  console.log(np.dot(3, 4));
  // BigInt is required.
  t.end();
});
