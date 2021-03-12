const test = require('ava');
const boa = require('../../');
const np = boa.import('numpy');

test('the numpy constants', t => {
  t.is(np.Inf, Infinity);
  t.is(np.NINF, -Infinity);
  t.assert(isNaN(np.NAN, NaN));

  // TODOs
  console.log(np.NZERO);
  console.log(np.e);
  console.log(np.euler_gamma);
  console.log(np.pi);
});
