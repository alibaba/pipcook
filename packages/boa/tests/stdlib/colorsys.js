const test = require('ava');
const boa = require('../../');

test('the `syscolor` module', t => {
  const colorsys = boa.import('colorsys');
  const { len, min, max } = boa.builtins();
  {
    const v = colorsys.rgb_to_hsv(0.2, 0.8, 0.4);
    console.log(v);
    t.is(len(v), 3);
    t.is(min(v), 0.3888888888888889);
    t.is(max(v), 0.8);
  }
});
