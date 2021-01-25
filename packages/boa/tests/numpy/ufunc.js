const test = require('ava');
const boa = require('../../');
const np = boa.import('numpy');

test('the ndarry constructor', t => {
  console.log(`${np.typecodes['All']}`);
  t.pass();
});