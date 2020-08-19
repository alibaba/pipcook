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
    return null;
  }
}

describe('test dataloder', () => {
  it('should return data immediately when data is ready', async () => {
    const dataLoader = new LocalDataLoader();
    dataLoader.processIndex = 5;
    const nextData = await dataLoader.next();
    const nextDataBatch = await dataLoader.nextBatch(2);
    expect(nextData?.data).not.toBeNull();
    expect(nextData?.label).not.toBeNull();
    expect(nextDataBatch?.length).toBe(2);
  });

  it('should wait until data is processed', async () => {
    const dataLoader = new LocalDataLoader();
    dataLoader.processIndex = 1;
    setTimeout(() => {
      dataLoader.processIndex = 5;
      dataLoader.notifyProcess();
    }, 1000);
    const nextDataBatch = await dataLoader.nextBatch(3);
    expect(nextDataBatch?.length).toBe(3);
  }, 3000);

  it('should read data from beginning when it reaches end', async () => {
    const dataLoader = new LocalDataLoader();
    dataLoader.processIndex = 5;
    await dataLoader.nextBatch(4);
    expect(dataLoader.getFetchIndex()).toBe(4);
  });

  it('next batch should be updated', async () => {
    const dataLoader = new LocalDataLoader();
    dataLoader.processIndex = 9;
    await dataLoader.nextBatch(4);
    const recordIndex = dataLoader.getFetchIndex();
    await dataLoader.nextBatch(4);
    const compareIndex = dataLoader.getFetchIndex();
    expect(recordIndex).not.toEqual(compareIndex);
  });
});
