'use strict';

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
// eslint-disable-next-line no-unused-vars
const { len, tuple } = boa.builtins();

test('numpy.empty: return a new array of given shape and type, without initializing entries.', t => {
  {
    const r = np.empty([2, 2]);
    console.log(`${r}`);
  }
  {
    const r = np.empty([2, 2], boa.kwargs({ dtype: np.int }));
    console.log(`${r}`);
  }
  t.end();
});
