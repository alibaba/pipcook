import test from 'ava';
import * as boa from '../..';

test('test typescript import builtins', (t) => {
  const builtins = boa.builtins();
  t.is(typeof builtins.toString(), 'string');
  const mlist = builtins.list([1, 3, 5]);
  t.is(JSON.stringify({ foobar: mlist }),
                      '{"foobar":[1,3,5]}');
});

test('test typescript import official module', (t) => {
  const colorsys = boa.import('colorsys');
  const { len, min, max } = boa.builtins();
  {
    const v = colorsys.rgb_to_hsv(0.2, 0.8, 0.4);
    t.is(len(v), 3);
    t.is(min(v), 0.3888888888888889);
    t.is(max(v), 0.8);
  }
});

test('test typescript symbols', (t) => {
  const colorsys = boa.import('colorsys');
  t.is(colorsys[boa.symbols.GetOwnershipSymbol](), true);
});
