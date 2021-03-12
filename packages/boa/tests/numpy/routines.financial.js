const test = require('ava');
const boa = require('../../');
const np = boa.import('numpy');

test('numpy.fv: future value', t => {
  const r = np.fv(0.05 / 12, 10 * 12, -100, -100);
  t.is(r, 15692.928894335748);
});

test('numpy.pv: present value', t => {
  const r = np.pv(0.05 / 12, 10 * 12, -100, 15692.93)
  t.is(r, -100.00067131625819);
});
