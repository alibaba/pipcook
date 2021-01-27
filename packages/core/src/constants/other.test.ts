import test from 'ava';
import { OutputType } from './other';

test('should own some constants', (t) => {
  t.is(OutputType.Data, 'data');
  t.is(OutputType.Model, 'model');
  t.is(OutputType.Evaluate, 'evaluate');
  t.is(OutputType.Merge, 'merge');
  t.is(OutputType.ModelToSave, 'modeltosave');
  t.is(OutputType.OriginData, 'origindata');
});
