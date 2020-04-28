import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELTRAIN,
  MODELEVALUATE,
} from './plugins';

describe('plugins constant', () => {
  it('should own some constants', () => {
    expect(DATACOLLECT).toEqual('dataCollect');
    expect(DATAACCESS).toEqual('dataAccess');
    expect(DATAPROCESS).toEqual('dataProcess');
    expect(MODELLOAD).toEqual('modelLoad');
    expect(MODELTRAIN).toEqual('modelTrain');
    expect(MODELEVALUATE).toEqual('modelEvaluate');
  });
});
