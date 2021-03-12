const test = require('ava');
const boa = require('../../');

test('simple eval', t => {
  t.is(boa.eval`10`, 10);
  t.is(boa.eval`10 + 20`, 30);
  t.is(boa.eval('10 + 20'), 30);
});

test('eval with context', t => {
  const np = boa.import('numpy');
  const x = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
  const y = 100;
  t.is(boa.eval`${y} + 10`, 110);
  t.is(boa.eval`len(${x})`, 2);
  {
    const res = boa.eval`${y} + ${x}`;
    t.is(res.shape[0], x.shape[0]);
    t.is(res.shape[1], x.shape[1]);
  }
});
