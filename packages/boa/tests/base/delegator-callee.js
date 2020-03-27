'use strict';

const { test } = require('tap');
const callee = require('../../lib/delegators/callee');

test('simple callee delegator', t => {
  const fn = callee();
  t.strictEqual(typeof fn, 'function');
  t.throws(fn, TypeError);
  t.end();
});
