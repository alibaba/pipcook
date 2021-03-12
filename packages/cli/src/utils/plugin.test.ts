import test from 'ava';
import { extractVersion } from './plugin';

test('extract version', (t) => {
  const name = 'plugin-name';
  const nameScope = '@scope/plugin-name';
  t.deepEqual(extractVersion(name), { name, version: 'latest' });
  t.deepEqual(extractVersion(nameScope), { name: nameScope, version: 'latest' });
  t.deepEqual(extractVersion(`${name}@1.1.0`), { name, version: '1.1.0' });
  t.deepEqual(extractVersion(`${name}@beta`), { name, version: 'beta' });
  t.deepEqual(extractVersion(`${name}@alpha`), { name, version: 'alpha' });
  t.deepEqual(extractVersion(`${nameScope}@latest`), { name: nameScope, version: 'latest' });
  t.deepEqual(extractVersion(`${nameScope}@beta`), { name: nameScope, version: 'beta' });
  t.deepEqual(extractVersion(`${nameScope}@alpha`), { name: nameScope, version: 'alpha' });
  t.deepEqual(extractVersion(`${nameScope}@latest`), { name: nameScope, version: 'latest' });
});
