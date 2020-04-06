

const { test } = require('tap');
const boa = require('../../');
const np = boa.import('numpy');
// eslint-disable-next-line no-unused-vars
const { len, tuple } = boa.builtins();

test('numpy.fv: future value', t => {
  const r = np.fv(0.05 / 12, 10 * 12, -100, -100);
  t.equal(r, 15692.928894335748);
  t.end();
});

test('numpy.pv: present value', t => {
  const r = np.pv(0.05 / 12, 10 * 12, -100, 15692.93)
  t.equal(r, -100.00067131625819);
  t.end();
});
