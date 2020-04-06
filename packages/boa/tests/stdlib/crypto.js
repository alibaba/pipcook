

const { test } = require('tap');
const boa = require('../../');

test('the `hashlib` module', t => {
  const hashlib = boa.import('hashlib');
  let m = hashlib.sha256();
  let s = boa.bytes('nobody');
  m.update(s);
  console.log(`${m.digest()}`);
  t.end();
});
