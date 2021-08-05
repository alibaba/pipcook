import test from 'ava';
import * as DataCook from '@pipcook/datacook';
import { makeImageClassificationDatasetFromList } from './image-classification';

test('make dataset pool from train and test list', async (t) => {
  const buffer1 = new ArrayBuffer(1);
  const buffer2 = new ArrayBuffer(2);
  const opts = {
    train: [
      {
        category: 'a',
        uri: 'uri mock'
      },
      {
        category: 'b',
        buffer: buffer1
      }
    ],
    test: [
      {
        category: 'b',
        uri: 'test uri mock'
      },
      {
        category: 'a',
        buffer: buffer2
      }
    ],
    valid: undefined,
    predicted: undefined
  };
  const dataset = makeImageClassificationDatasetFromList(opts);
  t.deepEqual(await dataset.getDatasetMeta(), {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 2, test: 2, valid: 0, predicted: 0 },
    categories: [ 'a', 'b' ]
  });
  t.truthy(dataset.train);
  t.truthy(dataset.test);
  t.falsy(dataset.valid);
  t.falsy(dataset.predicted);
  const sample1 = await dataset.train?.next();
  const sample2 = await dataset.train?.next();
  const sample3 = await dataset.train?.next();
  t.deepEqual(sample1, {
    data: { uri: 'uri mock', buffer: undefined },
    label: 'a'
  });
  t.deepEqual(sample2, {
    data: { buffer: buffer1, uri: undefined },
    label: 'b'
  });
  t.is(sample3, undefined);
});

test('make dataset pool from valid and predict list', async (t) => {
  const buffer1 = new ArrayBuffer(1);
  const buffer2 = new ArrayBuffer(2);
  const opts = {
    valid: [
      {
        category: 'a',
        uri: 'uri mock'
      },
      {
        category: 'b',
        buffer: buffer1
      }
    ],
    predicted: [
      {
        category: 'b',
        uri: 'test uri mock'
      },
      {
        category: 'a',
        buffer: buffer2
      }
    ],
    train: undefined,
    test: undefined
  };
  const dataset = makeImageClassificationDatasetFromList(opts);
  t.deepEqual(await dataset.getDatasetMeta(), {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 0, test: 0, valid: 2, predicted: 2 },
    categories: undefined
  });
  t.falsy(dataset.train);
  t.falsy(dataset.test);
  t.truthy(dataset.valid);
  t.truthy(dataset.predicted);
  const sample1 = await dataset.valid?.next();
  const sample2 = await dataset.valid?.next();
  const sample3 = await dataset.valid?.next();
  t.deepEqual(sample1, {
    data: { uri: 'uri mock', buffer: undefined },
    label: 'a'
  });
  t.deepEqual(sample2, {
    data: { buffer: buffer1, uri: undefined },
    label: 'b'
  });
  t.is(sample3, undefined);
});
