

const { test } = require('tap');
const boa = require('../../');

test('the `syscolor` module', t => {
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
