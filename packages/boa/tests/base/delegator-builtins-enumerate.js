'use strict';

const { test } = require('tap');
const boa = require('../../');
const { range, enumerate } = boa.builtins();

test('builtins.enumerate', t => {
  t.plan(11);
  const r = enumerate(range(0, 10)).forEach((v, i) => {
    t.equal(v, i);
  });
  t.equal(r, undefined);
  t.end();
});

test('builtins.enumerate with es6 destructing', t => {
  const [r0, r1,, r3] = enumerate(range(0, 10));
  t.equal(r0[0], r0[1]);
  t.equal(r1[0], r1[1]);
  t.equal(r3[0], r3[1]);

  const [...iter] = enumerate(range(0, 10));
  t.equal(iter.length, 10);

  const [i0, ...iter2] = enumerate(range(0, 10));
  t.equal(i0[0], i0[1]);
  t.equal(iter2.length, 9);
  t.end();
});
