import test from 'ava';
import { main } from '../../index';

test('application main', async (t) => {
  await t.notThrowsAsync(main(), 'application should be started');
});
