import test from 'ava';
import { DataLoader, Sample } from './common';

class LocalDataLoader extends DataLoader {
  async len(): Promise<number> {
    return 10;
  }

  async getItem(): Promise<Sample> {
    return {
      data: Math.random(),
      label: Math.random
    };
  }

  setItem(): Promise<void> {
    return Promise.resolve();
  }
}

test('should return data immediately when data is ready', async (t) => {
  const dataLoader = new LocalDataLoader();
  dataLoader.processIndex = 5;
  const nextData = await dataLoader.next();
  const nextDataBatch = await dataLoader.nextBatch(2);
  t.truthy(nextData?.data);
  t.truthy(nextData?.label);
  t.is(nextDataBatch?.length, 2);
});

test('should wait until data is processed', async (t) => {
  const dataLoader = new LocalDataLoader();
  dataLoader.processIndex = 1;
  setTimeout(() => {
    dataLoader.processIndex = 5;
    dataLoader.notifyProcess();
  }, 1000);
  const nextDataBatch = await dataLoader.nextBatch(3);
  t.is(nextDataBatch?.length, 3);
}, 3000);

test('should read data from beginning when it reaches end', async (t) => {
  const dataLoader = new LocalDataLoader();
  dataLoader.processIndex = 5;
  await dataLoader.nextBatch(4);
  t.is(dataLoader.getFetchIndex(), 4);
});

test('next batch should be updated', async (t) => {
  const dataLoader = new LocalDataLoader();
  dataLoader.processIndex = 9;
  await dataLoader.nextBatch(4);
  const recordIndex = dataLoader.getFetchIndex();
  await dataLoader.nextBatch(4);
  const compareIndex = dataLoader.getFetchIndex();
  t.true(recordIndex !== compareIndex);
});
