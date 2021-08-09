import test from 'ava';
import * as DataCook from '@pipcook/datacook';
import { Types } from '../';
import { makeDatasetPoolFromCsv } from './csv';
import Sample = DataCook.Dataset.Types.Sample;

const csvDataWithHead = 'A,B,C\n1,2,3\n4,5,6\n7,8,9';
const csvDataWithoutHead = '1,2,3\n4,5,6\n7,8,9';

const sample1: Sample = {
  data: {
    A: '1',
    B: '2'
  },
  label: {
    C: '3'
  }
};

const sample2: Sample = {
  data: {
    A: '4',
    B: '5'
  },
  label: {
    C: '6'
  }
};

const sample3: Sample = {
  data: {
    A: '7',
    B: '8'
  },
  label: {
    C: '9'
  }
};

const sampleNoHead1: Sample = {
  data: {
    '0': '1',
    '1': '2'
  },
  label: {
    '2': '3'
  }
};

const sampleNoHead2: Sample = {
  data: {
    '0': '4',
    '1': '5'
  },
  label: {
    '2': '6'
  }
};

const sampleNoHead3: Sample = {
  data: {
    '0': '7',
    '1': '8'
  },
  label: {
    '2': '9'
  }
};

test('should make a dataset from csv', async (t) => {
  const dataset = makeDatasetPoolFromCsv({
    trainData: csvDataWithHead,
    testData: csvDataWithHead,
    validData: undefined,
    hasHeader: true,
    labels: [ 'C' ]
  });

  const metadata: Types.Csv.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Table,
    size: { train: 3, test: 3, valid: 0, predicted: 0 }
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.train?.nextBatch(1), []);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
});
test('should make a dataset from csv with valid', async (t) => {
  const dataset = makeDatasetPoolFromCsv({
    trainData: csvDataWithHead,
    testData: csvDataWithHead,
    validData: csvDataWithHead,
    hasHeader: true,
    labels: [ 'C' ]
  });

  const metadata: Types.Csv.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Table,
    size: { train: 3, test: 3, valid: 3, predicted: 0 }
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.valid?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
  t.deepEqual(await dataset.valid?.nextBatch(1), [ sample2 ]);
});

test('should make a dataset from csv without head', async (t) => {
  const dataset = makeDatasetPoolFromCsv({
    trainData: csvDataWithoutHead,
    testData: csvDataWithoutHead,
    validData: csvDataWithoutHead,
    hasHeader: false,
    labels: [ '2' ]
  });

  const metadata: Types.Csv.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Table,
    size: { train: 3, test: 3, valid: 3, predicted: 0 }
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sampleNoHead1);
  t.deepEqual(await dataset.test?.next(), sampleNoHead1);
  t.deepEqual(await dataset.valid?.next(), sampleNoHead1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sampleNoHead2, sampleNoHead3 ]);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sampleNoHead2 ]);
  t.deepEqual(await dataset.valid?.nextBatch(1), [ sampleNoHead2 ]);
});
