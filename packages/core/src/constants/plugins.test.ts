import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  DATASETPROCESS,
  MODELTRAIN,
  MODELEVALUATE
} from './plugins';

describe('plugins constant', () => {
  it('should own some constants', () => {
    expect(DATACOLLECT).toEqual('dataCollect');
    expect(DATAACCESS).toEqual('dataAccess');
    expect(DATAPROCESS).toEqual('dataProcess');
    expect(DATASETPROCESS).toEqual('datasetProcess');
    expect(MODELTRAIN).toEqual('modelTrain');
    expect(MODELEVALUATE).toEqual('modelEvaluate');
  });
});
