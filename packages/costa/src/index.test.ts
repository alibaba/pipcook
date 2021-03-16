import test from 'ava';
import { Costa } from '.';

test('constructor', (t) => {
  const mockOpts: any = { mock: 'mock data' };
  const costa = new Costa(mockOpts);
  t.deepEqual(costa.options, mockOpts);
});
