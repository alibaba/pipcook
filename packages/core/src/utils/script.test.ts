import test from 'ava';
import * as sinon from 'sinon';
import { Script } from '.';
import { DataSourceType, ImageDataSourceMeta, Sample, ScriptContext } from '../types/runtime';
import { DataSourceApi } from '../types/runtime';

test('generate dataflow entry', async (t) => {
  const meta: ImageDataSourceMeta = {
    type: DataSourceType.Image,
    size: {
      train: 10,
      test: 11
    },
    dimension: {
      x: 128,
      y: 128,
      z: 3
    },
    labelMap: {
      1: ''
    }
  };
  const sample = {
    label: 1,
    data: [ 1, 2, 3 ]
  };
  const batchSample = [ sample, sample, sample, sample, sample ];
  const train = {
    next: async () => sample,
    nextBatch: async (size: number) => {
      t.is(size, 5, 'batch size should be 5');
      return batchSample;
    },
    seek: async (pos: number) => t.is(pos, 0, 'seek pos should be 0')
  };
  const options = { mock: 'mock value' };
  const context = { ctx: 'mock value' };
  const test = train;
  const mockDataSourceApi: DataSourceApi<any> = {
    getDataSourceMeta: async () => meta,
    train,
    test
  };
  const stubNext = sinon.stub().callsFake(async (sample: Sample<any> | null, opts: Record<string, any>, ctx: ScriptContext) => {
    t.deepEqual(options, opts, 'options is not correct for next');
    t.deepEqual(context as any, ctx, 'context is not correct for next');
    return sample;
  });
  const stubGetDataSourceMeta = sinon.stub().callsFake(async (api: DataSourceApi, opts: Record<string, any>, ctx: ScriptContext) => {
    t.deepEqual(options, opts, 'options is not correct');
    t.deepEqual(context as any, ctx, 'context is not correct');
    return api.getDataSourceMeta();
  });
  const entry = Script.generateDataFlow(stubNext, stubGetDataSourceMeta);
  const api = await entry(mockDataSourceApi, options, context as any);
  t.deepEqual(await api.getDataSourceMeta(), meta, 'meta is not correct');
  t.deepEqual(await api.train.next(), sample, 'next is not correct');
  t.deepEqual(await api.train.nextBatch(5), batchSample, 'nextBatch is not correct');
  await t.notThrowsAsync(api.train.seek(0), 'seek is not correct');
  t.deepEqual(await api.test.next(), sample, 'next is not correct');
  t.deepEqual(await api.test.nextBatch(5), batchSample, 'nextBatch is not correct');
  await t.notThrowsAsync(api.test.seek(0), 'seek is not correct');
});

test('generate dataflow entry with sample null', async (t) => {
  const meta = {
    type: DataSourceType.Image,
    size: {
      train: 10,
      test: 11
    },
    dimension: {
      x: 128,
      y: 128,
      z: 3
    },
    labelMap: {}
  };
  const sample = null;
  const batchSample = null;
  const train = {
    next: async () => sample,
    nextBatch: async (size: number) => {
      t.is(size, 5, 'batch size should be 5');
      return batchSample;
    },
    seek: async (pos: number) => t.is(pos, 0, 'seek pos should be 0')
  };
  const options = { mock: 'mock value' };
  const context = { ctx: 'mock value' };
  const test = train;
  const validation = train;
  const mockDataSourceApi: DataSourceApi<any> = {
    getDataSourceMeta: async () => meta,
    train,
    test,
    validation
  };
  const stubNext = sinon.stub().callsFake(async (sample: Sample<any> | null, opts: Record<string, any>, ctx: ScriptContext) => {
    t.deepEqual(options, opts, 'options is not correct for next');
    t.deepEqual(context as any, ctx, 'context is not correct for next');
    return sample;
  });
  const stubGetDataSourceMeta = sinon.stub().callsFake(async (api: DataSourceApi, opts: Record<string, any>, ctx: ScriptContext) => {
    t.deepEqual(options, opts, 'options is not correct');
    t.deepEqual(context as any, ctx, 'context is not correct');
    return api.getDataSourceMeta();
  });
  const entry = Script.generateDataFlow(stubNext, stubGetDataSourceMeta);
  const api = await entry(mockDataSourceApi, options, context as any);
  t.deepEqual(await api.getDataSourceMeta(), meta, 'meta is not correct');
  t.deepEqual(await api.train.next(), sample, 'next is not correct');
  t.deepEqual(await api.train.nextBatch(5), batchSample, 'nextBatch is not correct');
  await t.notThrowsAsync(api.train.seek(0), 'seek is not correct');
  t.deepEqual(await api.test.next(), sample, 'next is not correct');
  t.deepEqual(await api.test.nextBatch(5), batchSample, 'nextBatch is not correct');
  await t.notThrowsAsync(api.test.seek(0), 'seek is not correct');
});
