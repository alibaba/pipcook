const test = require('ava');
const boa = require('../../');

test('the `hashlib` module', t => {
  const hashlib = boa.import('hashlib');
  let m = hashlib.sha256();
  let s = boa.bytes('nobody');
  m.update(s);
  t.is(typeof m.digest(), 'object');
});
