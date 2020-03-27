'use strict';

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');

test('the numpy constants', t => {
  t.equal(np.Inf, Infinity);
  t.equal(np.NINF, -Infinity);
  t.ok(isNaN(np.NAN, NaN));

  // TODOs
  console.log(np.NZERO);
  console.log(np.e);
  console.log(np.euler_gamma);
  console.log(np.pi);
  t.end();
});
