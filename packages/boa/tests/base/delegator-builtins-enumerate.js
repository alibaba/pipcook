const test = require('ava');
const boa = require('../../');
const { range, enumerate } = boa.builtins();

test('builtins.enumerate', t => {
  const r = enumerate(range(0, 10)).forEach((v, i) => {
    t.is(v, i);
  });
  t.is(r, undefined);
});

test('builtins.enumerate with es6 destructing', t => {
  const [r0, r1,, r3] = enumerate(range(0, 10));
  t.is(r0[0], r0[1]);
  t.is(r1[0], r1[1]);
  t.is(r3[0], r3[1]);

  const [...iter] = enumerate(range(0, 10));
  t.is(iter.length, 10);

  const [i0, ...iter2] = enumerate(range(0, 10));
  t.is(i0[0], i0[1]);
  t.is(iter2.length, 9);
});
