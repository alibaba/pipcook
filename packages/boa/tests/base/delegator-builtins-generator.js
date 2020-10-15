const test = require('tape');
const boa = require('../../');
const pybasic = boa.import('tests.base.basic');

test('builtins.generator', t => {
  const obj = pybasic.Foobar();
  const generator = obj.testGen(10);
  let real = 10;
  for (const ele of generator) {
    console.log(ele, real)
    t.equal(ele, real);
    real -= 1;
  }
  t.end();
});