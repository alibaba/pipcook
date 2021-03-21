import test, { ExecutionContext } from 'ava';
import * as sinon from 'sinon';
import { DataAccessorImpl } from './standalone-impl';

test.serial.afterEach(() => sinon.restore());

const mockDataAccess: any = {
  next: () => { return; },
  nextBatch: () => { return; },
  seek: () => { return; }
};

test.serial('initialize DataAccessorImpl', async (t) => {
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  await dataAccessor.init(20, 'hello');
  const randomArray = dataAccessor.createRandom(20, 'hello');
  t.is(dataAccessor.size, 20, 'data size should be 20');
  t.is(dataAccessor.randomIndex, 0, 'data randomIndex should be zero');
  t.deepEqual(dataAccessor.randomArray, randomArray, 'data randomArray shuold be equal');
});

test.serial('run dataAccessorImpl next', async (t) => {
  const mockNext = sinon.stub().callsFake(async () => {
    return { label: 1, data: 'next' };
  });
  sinon.replace(mockDataAccess, 'next', mockNext);
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  t.deepEqual(await dataAccessor.next(), { label: 1, data: 'next' }, 'should return sample');
  t.true(mockNext.calledOnce, 'next should be called once');
});

test.serial('run dataAccessorImpl nextBatch', async (t) => {
  const mockNextBatch = sinon.stub().callsFake(async (batchSize: number) => {
    return [ { label: batchSize, data: 'nextBatch' } ];
  });
  sinon.replace(mockDataAccess, 'nextBatch', mockNextBatch);
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  t.deepEqual(await dataAccessor.nextBatch(33), [ { label: 33, data: 'nextBatch' } ], 'should return samples');
  t.true(mockNextBatch.calledOnce, 'nextBatch should be called once');
});

test.serial('run dataAccessorImpl nextRandom', async (t) => {
  const mockNext = sinon.stub().callsFake(async () => {
    return { label: 1, data: 'next' };
  });
  sinon.replace(mockDataAccess, 'next', mockNext);
  const mockSeek = sinon.stub().callsFake(async () => { return; });
  sinon.replace(mockDataAccess, 'seek', mockSeek);
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  await dataAccessor.init(20, 'hello');
  await dataAccessor.nextRandom();
  t.true(mockSeek.calledOnce, 'seek should be called once');
  t.true(mockNext.calledOnce, 'next should be called twice');
  dataAccessor.randomIndex = 10;
  dataAccessor.size = 10;
  await dataAccessor.nextRandom();
  t.true(mockSeek.calledOnce, 'seek should be called once');
});

test.serial('run dataAccessorImpl nextBatchRandom', async (t) => {
  const mockNextRandom = sinon.stub().callsFake(async () => {
    return { label: 3, data: 'nextRandom' };
  });
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  await dataAccessor.init(20, 'hello');
  sinon.replace(dataAccessor, 'nextRandom', mockNextRandom);
  t.deepEqual(await dataAccessor.nextBatchRandom(3), [
    { label: 3, data: 'nextRandom' },
    { label: 3, data: 'nextRandom' },
    { label: 3, data: 'nextRandom' }
  ]);
  t.true(mockNextRandom.calledThrice, 'nextRandom shuold be called thrice');
});

test.serial('run dataAccessorImpl seek', async (t) => {
  const mockSeek = sinon.stub().callsFake(async () => { return; });
  sinon.replace(mockDataAccess, 'seek', mockSeek);
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  await dataAccessor.seek(0);
  t.true(mockSeek.calledOnce, 'seek should be called once');
  t.is(await dataAccessor.seek(0), undefined, 'should return void');
});

interface mockArgs {
  size: number; seed?: string;
}
function randomEqualMacro(t: ExecutionContext, args1: mockArgs, args2: mockArgs, compareType: string) {
  const { createRandom } = new DataAccessorImpl(mockDataAccess);
  if ( compareType === 'deepEqual' ) {
    t.deepEqual( createRandom(args1.size, args1.seed), createRandom(args2.size, args2.seed) );
  } else if ( compareType === 'notDeepEqual' ) {
    t.notDeepEqual( createRandom(args1.size, args1.seed), createRandom(args2.size, args2.seed) );
  }
}
const preTitle = 'createRandom results should be';
randomEqualMacro.title = (providedTitle: string, arg1: mockArgs, arg2: mockArgs, compareType: string) => `${providedTitle} ${compareType} between [size ${arg1.size}: seed ${arg1.seed}] and [size ${arg2.size}: seed ${arg2.seed}]`;
test.serial(preTitle, randomEqualMacro, { size: 10, seed: 'test1' }, { size: 10, seed: 'test1' }, 'deepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10, seed: 'test2' }, { size: 10, seed: 'test2' }, 'deepEqual');
test.serial(preTitle, randomEqualMacro, { size: 100, seed: 'test1' }, { size: 100, seed: 'test1' }, 'deepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10, seed: 'test1' }, { size: 10, seed: 'test2' }, 'notDeepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10, seed: 'test1' }, { size: 100, seed: 'test1' }, 'notDeepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10 }, { size: 100 }, 'notDeepEqual');
test.serial(preTitle, randomEqualMacro, { size: 11 }, { size: 11 }, 'notDeepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10, seed: undefined }, { size: 10, seed: 'test3' }, 'notDeepEqual');
test.serial(preTitle, randomEqualMacro, { size: 10, seed: undefined }, { size: 10, seed: undefined }, 'notDeepEqual');

test.serial('run dataAccessorImpl resetRandom', async (t) => {
  const mockCreateRandom = sinon.stub().callsFake((size: number, seed?: string) => { return seed ? [ 3 ] : [ 1 ]; });
  const dataAccessor = new DataAccessorImpl(mockDataAccess);
  sinon.replace(dataAccessor, 'createRandom', mockCreateRandom);
  t.deepEqual(await dataAccessor.resetRandom(), [ 1 ], 'resetRandom should return correctly');
  t.deepEqual(await dataAccessor.resetRandom('string'), [ 3 ], 'resetRandom should return correctly while string exist');
});
