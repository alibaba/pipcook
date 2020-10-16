const test = require('tape');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');

test('builtins.generator', t => {
  const obj = pybasic.Foobar();
  const generator = obj.testGen(10);
  let real = 10;
  for (const ele of generator) {
    t.equal(ele, real);
    real -= 1;
  }
  t.end();
});

test('builtins.generator with next', t => {
  const obj = pybasic.Foobar();
  const generator = obj.testGen(0);
  let real = 0;
  let val = generator.next();

  t.equal(val.value, real);
  t.equal(val.done, false);

  console.log('i am still running');

  val = generator.next();
  t.equal(val.value, undefined);
  t.equal(val.done, true);
  t.end();
});
