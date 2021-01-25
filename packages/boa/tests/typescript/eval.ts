import test from 'ava';
import * as boa from '../../';

test('test typescript eval(simple)', (t) => {
  t.is(boa.eval`10` as any, 10);
  t.is(boa.eval`10 + 20` as any, 30);
  t.is(boa.eval('10 + 20') as any, 30);
});

test('test typescript eval(context)', (t) => {
  const np = boa.import('numpy');
  const x = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
  const y = 100;
  t.is(boa.eval`${y} + 10` as any, 110);
  t.is(boa.eval`len(${x})` as any, 2);
  {
    const res = boa.eval`${y} + ${x}`;
    t.is(res.shape[0], x.shape[0]);
    t.is(res.shape[1], x.shape[1]);
  }
});
