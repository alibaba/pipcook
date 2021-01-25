const test = require('ava');
const boa = require('../../');
const builtins = boa.builtins();

test('builtins constants', t => {
  t.is(builtins.True, true);
  t.is(builtins.False, false);
  t.is(builtins.None, null);
  t.is(Boolean(builtins.NotImplemented), true);
  t.is(Boolean(builtins.Ellipsis), true);
  t.is(Boolean(builtins.__debug__), true);
});

test('`builtins.abs()` function', t => {
  const { abs } = builtins;
  t.is(abs(100), 100);
  t.is(abs(-100), 100);
  t.is(abs(10.06), 10.06);
  t.is(abs(-10.06), 10.06);
});

test('`builtins.bin` function', t => {
  const { bin } = builtins;
  t.is(bin(3), '0b11');
  t.is(bin(-10), '-0b1010');
});

test('`builtins.bytes` function', t => {
  const { bytes, type } = builtins;
  const bval = bytes.fromhex('2Ef0 F1f2');
  t.is(type(bval).__name__, 'bytes');
  t.is(bval.hex(), '2ef0f1f2');
});

test('`builtins.hash()` function', t => {
  const { hash } = builtins;
  t.is(typeof hash(hash), 'number');
});

test('`builtins.help()` function', t => {
  t.is(typeof builtins.help(builtins.abs), 'object');
});

test('`builtins.hex()` function', t => {
  const { hex } = builtins;
  t.is(hex(255), '0xff');
  t.is(hex(-42), '-0x2a');
});

test('`builtins.int` class', t => {
  t.is(builtins.int(16), 16);
  t.is(builtins.int(255), 255);
});

test('`builtins.list` class', t => {
  const { list, len } = builtins;
  const foo = [100, 200, 300];
  const bar = list(foo);
  t.is(len(bar), foo.length);
  t.is(len(foo), len(bar));
  foo.forEach((v, i) => t.is(bar[i], v));
});

test('`builtins.len()` function', t => {
  const { len, dict } = builtins;
  const obj = {
    a0: 1,
    a1: 2,
    a2: 3,
  };
  const arr = [30, 31, 32, 100];
  t.is(len(dict(boa.kwargs(obj))), Object.keys(obj).length);
  t.is(len(arr), arr.length);
});

test('`builtins.min()` and `builtins.max()` function', t => {
  const { min, max } = builtins;
  t.is(min([1, 2, 3]), 1);
  t.is(max([1, 2, 3]), 3);
  t.is(min(1, 2, 3), 1);
  t.is(max(1, 2, 3), 3);
});

test('`builtins.ord()` function', t => {
  const { ord } = builtins;
  const chars = ['a', 'b', 'c', 'd', 'e'];
  t.plan(chars.length);
  chars.forEach(c => {
    t.is(ord(c), c.charCodeAt(0), `ord(${c}) is right`);
  });
});

test('`builtins.pow()` function', t => {
  const { pow } = builtins;
  t.is(pow(10, 2), 100);
  t.is(pow(38, 10, 97), 66);
});

test('`builtins.range()` function', t => {
  const { range, len } = builtins;
  {
    const r = range(10);
    t.is(len(r), 10, 'the len(range(10)) should be 10');
    t.is(r[0], 0, 'the first should be 0');
    t.is(r[9], 9, 'the last should be 9');
  }
  {
    const r = range(0, 20);
    t.is(len(r), 20);
    t.is(r[0], 0);
    t.is(r[19], 19);
  }
  {
    const r = range(0, 21, 5);
    t.is(len(r), 5);
    t.is(r[0], 0);
    t.is(r[1], 5);
    t.is(r[2], 10);
    t.is(r[3], 15);
    t.is(r[4], 20);
  }
  {
    const r = range(0, 5);
    const s = r.slice(1, 5, 1);
    t.is(len(s), len(r) - 1);
    t.is(s[0], r[1]);
  }
});

test('`builtins.round()` function', t => {
  const { round } = builtins;
  const n = 10.123;
  t.is(round(n), 10);
  t.is(round(n, 1), 10.1);
  t.is(round(n, 2), 10.12);
  t.is(round(n, 3), 10.123);
});

test('`builtins.tuple()` function', t => {
  const { tuple, range, len } = builtins;
  const aEmptyTuple = tuple();
  t.is(len(aEmptyTuple), 0);
  const aTupleFromRange = tuple(range(0, 20));
  t.is(len(aTupleFromRange), 20);
});

test('`builtins.type()` function', t => {
  const { tuple, type } = builtins;
  const aTuple = tuple();
  t.is(type(aTuple).__name__, 'tuple');
  t.is(type(tuple).__name__, 'type');
});
