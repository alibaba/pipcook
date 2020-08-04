

const { test } = require('tap');
const boa = require('../../');
const builtins = boa.builtins();

test('builtins constants', t => {
  t.strictEqual(builtins.True, true);
  t.strictEqual(builtins.False, false);
  t.strictEqual(builtins.None, null);
  t.ok(builtins.NotImplemented);
  t.ok(builtins.Ellipsis);
  t.ok(builtins.__debug__);
  t.end();
});

test('`builtins.abs()` function', t => {
  const { abs } = builtins;
  t.equal(abs(100), 100);
  t.equal(abs(-100), 100);
  t.equal(abs(10.06), 10.06);
  t.equal(abs(-10.06), 10.06);
  t.end();
});

test('`builtins.bin` function', t => {
  const { bin } = builtins;
  t.equal(bin(3), '0b11');
  t.equal(bin(-10), '-0b1010');
  t.end();
});

test('`builtins.bytes` function', t => {
  const { bytes, type } = builtins;
  const bval = bytes.fromhex('2Ef0 F1f2');
  t.equal(type(bval).__name__, 'bytes');
  t.equal(bval.hex(), '2ef0f1f2');
  t.end();
});

test('`builtins.hash()` function', t => {
  const { hash } = builtins;
  t.equal(typeof hash(hash), 'number');
  t.end();
});

test('`builtins.help()` function', t => {
  builtins.help(builtins.abs);
  t.end();
});

test('`builtins.hex()` function', t => {
  const { hex } = builtins;
  t.equal(hex(255), '0xff');
  t.equal(hex(-42), '-0x2a');
  t.end();
});

test('`builtins.int` class', t => {
  t.equal(builtins.int(16), 16);
  t.equal(builtins.int(255), 255);
  t.end();
});

test('`builtins.list` class', t => {
  const { list, len } = builtins;
  const foo = [100, 200, 300];
  const bar = list(foo);
  t.equal(len(bar), foo.length);
  t.equal(len(foo), len(bar));
  foo.forEach((v, i) => t.equal(bar[i], v));
  t.end();
});

test('`builtins.len()` function', t => {
  const { len, dict } = builtins;
  const obj = {
    a0: 1,
    a1: 2,
    a2: 3,
  };
  const arr = [30, 31, 32, 100];
  t.equal(len(dict(boa.kwargs(obj))), Object.keys(obj).length);
  t.equal(len(arr), arr.length);
  t.end();
});

test('`builtins.min()` and `builtins.max()` function', t => {
  const { min, max } = builtins;
  t.equal(min([1, 2, 3]), 1);
  t.equal(max([1, 2, 3]), 3);
  t.equal(min(1, 2, 3), 1);
  t.equal(max(1, 2, 3), 3);
  t.end();
});

test('`builtins.ord()` function', t => {
  const { ord } = builtins;
  const chars = ['a', 'b', 'c', 'd', 'e'];
  t.plan(chars.length);
  chars.forEach(c => {
    t.equal(ord(c), c.charCodeAt(0), `ord(${c}) is right`);
  });
  t.end();
});

test('`builtins.pow()` function', t => {
  const { pow } = builtins;
  t.equal(pow(10, 2), 100);
  t.equal(pow(38, 10, 97), 66);
  t.end();
});

test('`builtins.range()` function', t => {
  const { range, len } = builtins;
  {
    const r = range(10);
    t.equal(len(r), 10, 'the len(range(10)) should be 10');
    t.equal(r[0], 0, 'the first should be 0');
    t.equal(r[9], 9, 'the last should be 9');
  }
  {
    const r = range(0, 20);
    t.equal(len(r), 20);
    t.equal(r[0], 0);
    t.equal(r[19], 19);
  }
  {
    const r = range(0, 21, 5);
    t.equal(len(r), 5);
    t.equal(r[0], 0);
    t.equal(r[1], 5);
    t.equal(r[2], 10);
    t.equal(r[3], 15);
    t.equal(r[4], 20);
  }
  {
    const r = range(0, 5);
    const s = r.slice(1, 5, 1);
    t.equal(len(s), len(r) - 1);
    t.equal(s[0], r[1]);
  }
  t.end();
});

test('`builtins.round()` function', t => {
  const { round } = builtins;
  const n = 10.123;
  t.equal(round(n), 10);
  t.equal(round(n, 1), 10.1);
  t.equal(round(n, 2), 10.12);
  t.equal(round(n, 3), 10.123);
  t.end();
});

test('`builtins.tuple()` function', t => {
  const { tuple, range, len } = builtins;
  const aEmptyTuple = tuple();
  t.equal(len(aEmptyTuple), 0);
  const aTupleFromRange = tuple(range(0, 20));
  t.equal(len(aTupleFromRange), 20);
  t.end();
});

test('`builtins.type()` function', t => {
  const { tuple, type } = builtins;
  const aTuple = tuple();
  t.equal(type(aTuple).__name__, 'tuple');
  t.equal(type(tuple).__name__, 'type');
  t.end();
});
