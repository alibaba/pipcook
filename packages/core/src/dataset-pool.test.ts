import test from 'ava';
import * as sinon from 'sinon';
import * as DataCook from '@pipcook/datacook';
import { makeDatasetPool, transformDatasetPool, transformSampleInDataset } from './dataset-pool';

import Types = DataCook.Dataset.Types;

class TestDatasetMeta implements Types.DatasetMeta {
  type: Types.DatasetType = Types.DatasetType.Image;
  size: Types.DatasetSize = {
    train: 3,
    test: 3
  };
  labelMap: { 1: '1' }
}

test('should install and has version number and module exists', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  };
  const trainSamples: Array<Types.Sample> = [sample, sample, sample];
  const testSamples: Array<Types.Sample> = [sample, sample, sample];

  const meta = new TestDatasetMeta();

  const dataset = makeDatasetPool({
    trainData: trainSamples,
    testData: testSamples,
  }, meta);

  t.deepEqual(await dataset.getDatasetMeta(), meta);
  t.deepEqual(await dataset.train?.next(), sample);
  t.deepEqual(await dataset.test?.next(), sample);
  t.deepEqual(await dataset.train?.nextBatch(3), [ sample, sample ]);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample ]);
});

test('should iter a dataset after shuffle', async (t) => {
  const sampleMaker = (num: number) => {
    return {
      data: num,
      label: num
    }
  }
  const trainSamples: Array<Types.Sample> = [sampleMaker(0), sampleMaker(1), sampleMaker(2)];
  const testSamples: Array<Types.Sample> = [sampleMaker(3), sampleMaker(4), sampleMaker(5)];

  const meta = new TestDatasetMeta();

  const dataset = makeDatasetPool({
    trainData: trainSamples,
    testData: testSamples,
    validData: testSamples,
    predictedData: testSamples
  }, meta);

  DataCook.Generic.seed('test');
  dataset.shuffle();

  const trainData = (await dataset.train?.nextBatch(3))?.map((it: Types.Sample) => it.data);
  const testData = (await dataset.test?.nextBatch(3))?.map((it: Types.Sample) => it.data);

  t.deepEqual(await dataset.getDatasetMeta(), meta);
  t.deepEqual(trainData, [ 1, 0, 2 ]);
  t.deepEqual(testData, [ 4, 3, 5 ]);
});

test('should read a zero batch', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  }
  const trainSamples: Array<Types.Sample> = [sample, sample, sample];
  const testSamples: Array<Types.Sample> = [sample, sample, sample];

  const meta = new TestDatasetMeta();

  const dataset = makeDatasetPool({
    trainData: trainSamples,
    testData: testSamples,
    validData: testSamples,
    predictedData: testSamples
  }, meta);

  t.deepEqual(await dataset.train?.nextBatch(0), []);
});

test('should read a whole batch', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  }
  const trainSamples: Array<Types.Sample> = [sample, sample, sample];
  const testSamples: Array<Types.Sample> = [sample, sample, sample];

  const meta = new TestDatasetMeta();

  const dataset = makeDatasetPool({
    trainData: trainSamples,
    testData: testSamples,
    validData: testSamples,
    predictedData: testSamples
  }, meta);

  t.deepEqual(await dataset.train?.nextBatch(-1), trainSamples);
});

test('should make an empty dataset pool', async (t) => {
  const dataset = makeDatasetPool({}, undefined);
  t.notThrows(() => dataset.shuffle());
  t.falsy(dataset.train);
  t.falsy(dataset.test);
  t.falsy(dataset.valid);
  t.falsy(dataset.predicted);
  t.falsy(await dataset.getDatasetMeta());
});

test('should transform dataset pool', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  };
  const sampleTransformed: Types.Sample<number> = {
    data: 2,
    label: 2
  };
  const metaTransformed: Types.DatasetMeta = {
    type: Types.DatasetType.General
  };

  const samples: Array<Types.Sample> = [sample, sample, sample];

  const dataset = makeDatasetPool({
    trainData: samples,
    testData: samples,
    validData: samples,
    predictedData: samples
  }, undefined);
  const opt = {
    transform: sinon.stub().resolves(sampleTransformed),
    metadata: sinon.stub().resolves(metaTransformed)
  };
  const transform = transformDatasetPool(opt, dataset);
  t.deepEqual(await transform.train?.next(), sampleTransformed);
  t.deepEqual(await transform.test?.next(), sampleTransformed);
  t.deepEqual(await transform.valid?.next(), sampleTransformed);
  t.deepEqual(await transform.predicted?.next(), sampleTransformed);
  t.is(opt.transform.callCount, 4, 'should be called 4 times');
  t.deepEqual(await transform.getDatasetMeta(), metaTransformed);
  t.true(opt.metadata.calledOnce);
  t.deepEqual(opt.metadata.args[0], [ undefined ]);
  t.notThrows(() => transform.shuffle());
});

test('should transform dataset', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  };
  const sampleTransformed: Types.Sample<number> = {
    data: 2,
    label: 2
  };

  const samples: Array<Types.Sample> = [sample, sample, sample];

  const dataset = makeDatasetPool({
    trainData: samples,
    testData: samples,
    validData: samples,
    predictedData: samples
  }, undefined);
  const transformFunction = sinon.stub().resolves(sampleTransformed);
  const transform = transformSampleInDataset(transformFunction, dataset);
  t.deepEqual(await transform.train?.next(), sampleTransformed);
  t.deepEqual(await transform.test?.next(), sampleTransformed);
  t.deepEqual(await transform.valid?.next(), sampleTransformed);
  t.deepEqual(await transform.predicted?.next(), sampleTransformed);
  t.is(transformFunction.callCount, 4, 'should be called 4 times');
  t.deepEqual(await transform.getDatasetMeta(), undefined);
  t.notThrows(() => transform.shuffle());
});

test('should throw an error', async (t) => {
  const sample: Types.Sample<number> = {
    data: 1,
    label: 1
  };
  const trainSamples: Array<Types.Sample> = [sample, sample, sample];
  const testSamples: Array<Types.Sample> = [sample, sample, sample];

  const meta = new TestDatasetMeta();

  const dataset = makeDatasetPool({
    trainData: trainSamples,
    testData: testSamples,
  }, meta);
  if (!dataset.train) {
    return t.fail();
  }
  await t.throwsAsync(dataset.train.nextBatch(-2), { message: 'Batch size should be larger than -1 but -2 is present' });
})
