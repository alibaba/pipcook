import * as boa from '../../';
import test from 'tape';

test('test typescript kwargs', (t: test.Test) => {
  const string = boa.import('string');
  const fmt = string.Formatter();
  t.strictEqual(fmt.format('foobar {0} {1}', 'a', 'b'), 'foobar a b');
  t.strictEqual(fmt.format('foobar {name}', boa.kwargs({ name: 'test' })),
                'foobar test');
  t.end();
});
