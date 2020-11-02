import * as boa from '../../';
import test from 'tape';

test('test typescript with-statement', (t: test.Test) => {
  t.plan(1);
  const { open } = boa.builtins();
  boa.with(open(__filename, 'r'), (f) => {
    console.log(f);
    t.pass();
    // no need to close because of `boa.with()`.
  }).then(() => {
    t.end();
  });
});

