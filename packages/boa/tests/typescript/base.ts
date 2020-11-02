import * as boa from '../..';
import test from 'tape';

test('test typescript import builtins', (t: test.Test) => {
  const builtins = boa.builtins();
  t.strictEqual(typeof builtins.toString(), 'string');
  const mlist = builtins.list([1, 3, 5]);
  t.strictEqual(JSON.stringify({ foobar: mlist }),
                '{"foobar":[1,3,5]}');
  t.end();
});

test('test typescript import official module', (t: test.Test) => {
  const colorsys = boa.import('colorsys');
  const { len, min, max } = boa.builtins();
  {
    const v = colorsys.rgb_to_hsv(0.2, 0.8, 0.4);
    console.log(v);
    t.ok(len(v) === 3);
    t.ok(min(v) === 0.3888888888888889);
    t.ok(max(v) === 0.8);
  }
  t.end();
});

test('test typescript symbols', (t: test.Test) => {
  const colorsys = boa.import('colorsys');
  t.strictEqual(colorsys[boa.symbols.GetOwnershipSymbol](), true);
  t.end();
});
