const test = require('tape');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');

test('builtins.generator', t => {
  const obj = pybasic.Foobar();
  let count = 10;

  const generator = obj.testGen(count);
  for (const ele of generator) {
    t.equal(ele, count);
    count -= 1;
  }
  t.end();
});

test('builtins.generator with next', t => {
  const obj = pybasic.Foobar();
  const count = 0;

  const generator = obj.testGen(count);

  let val = generator.next();

  t.equal(val.value, count);
  t.equal(val.done, false);

  val = generator.next();
  t.equal(val.value, undefined);
  t.equal(val.done, true);
  t.end();
});
