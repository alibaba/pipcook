const test = require('tape');
const boa = require('../../');
const np = boa.import('numpy');

test('the dot function', t => {
  console.log(np.dot(3, 4));
  // BigInt is required.
  t.end();
});
