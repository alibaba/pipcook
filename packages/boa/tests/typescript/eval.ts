import * as boa from '../../';
import test from 'tape';

test('test typescript eval(simple)', (t: test.Test) => {
  t.equal(boa.eval`10`, 10);
  t.equal(boa.eval`10 + 20`, 30);
  t.equal(boa.eval('10 + 20'), 30);
  t.end();
});

test('test typescript eval(context)', (t: test.Test) => {
  const np = boa.import('numpy');
  const x = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
  const y = 100;
  t.equal(boa.eval`${y} + 10`, 110);
  t.equal(boa.eval`len(${x})`, 2);
  {
    const res = boa.eval`${y} + ${x}`;
    t.equal(res.shape[0], x.shape[0]);
    t.equal(res.shape[1], x.shape[1]);
  }
  t.end();
});
