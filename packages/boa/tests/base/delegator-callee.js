const test = require('ava');
const callee = require('../../lib/delegators/callee');

test('simple callee delegator', t => {
  const fn = callee();
  t.is(typeof fn, 'function');
  t.throws(fn, { instanceOf: TypeError });
});
