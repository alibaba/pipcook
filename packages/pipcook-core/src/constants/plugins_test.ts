import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELTRAIN,
  MODELEVALUATE,
  MODELDEPLOY,
  ONLINETRAIN
} from './plugins';

describe('plugins constant', () => {
  it('should has some constants', () => {
    expect(DATACOLLECT).toEqual('dataCollect');
    expect(DATAACCESS).toEqual('dataAccess');
    expect(DATAPROCESS).toEqual('dataProcess');
    expect(MODELLOAD).toEqual('modelLoad');
    expect(MODELTRAIN).toEqual('modelTrain');
    expect(MODELEVALUATE).toEqual('modelEvaluate');
    expect(MODELDEPLOY).toEqual('modelDeploy');
    expect(ONLINETRAIN).toEqual('onlineTrain');
  });
});
