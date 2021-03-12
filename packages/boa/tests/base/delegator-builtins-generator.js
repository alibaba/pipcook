const test = require('ava');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');

test('builtins.generator', t => {
  const obj = pybasic.Foobar();
  let count = 10;

  const generator = obj.testGen(count);
  for (const ele of generator) {
    t.is(ele, count);
    count -= 1;
  }
});

test('builtins.generator with next', t => {
  const obj = pybasic.Foobar();
  const count = 0;

  const generator = obj.testGen(count);

  let val = generator.next();

  t.is(val.value, count);
  t.is(val.done, false);

  val = generator.next();
  t.is(val.value, undefined);
  t.is(val.done, true);
});
