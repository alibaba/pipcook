import { app, assert } from 'midway-mock/bootstrap';
import { PipelineService } from '../../src/service/pipeline';

const mockPipeline = {
  id: 'mockId',
  name: 'mockName',
  dataCollectId: 'dataCollect',
  dataCollect: 'dataCollect',
  dataCollectParams: '{}',
  dataAccessId: 'dataAccessId',
  dataAccess: 'dataAccess',
  dataAccessParams: 'dataAccess',
  dataProcessId: 'dataProcess',
  dataProcess: 'dataProcess',
  dataProcessParams: 'dataProcess',
  datasetProcessId: 'dataProcess',
  datasetProcess: 'dataProcess',
  datasetProcessParams: 'dataProcess',
  modelDefineId: 'modelDefine',
  modelDefine: 'modelDefine',
  modelDefineParams: 'modelDefine',
  modelLoadId: 'modelLoadId',
  modelLoad: 'modelLoad',
  modelLoadParams: '{}',
  modelTrainId: 'modelTrain',
  modelTrain: 'modelTrain',
  modelTrainParams: 'modelTrain',
  modelEvaluateId: 'modelEval',
  modelEvaluate: 'modelEval',
  modelEvaluateParams: 'modelEval'
};

describe('test the pipeline service', () => {
  beforeEach(async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    await pipeline.removeJobs();
    await pipeline.removePipelines();
  })
  it('#create job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline(mockPipeline);
    const job = await pipeline.createJob(obj.id);
    const jobx = await pipeline.getJobById(job.id);
    console.log(jobx);
  });
  it('#create pipeline and get created pipeline', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline(mockPipeline);

    const p1 = await pipeline.getPipeline(obj.id);
    assert.ok(p1.id === obj.id, 'found the pipeline by created id');
    assert.ok(p1.dataCollect === 'dataCollect');
    await pipeline.removePipelineById(obj.id);
    
    console.log('removed and query');
    const notExists = await pipeline.getPipeline(obj.id);
    assert.ok(notExists == null);
  });

  it('#update pipeline', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline(mockPipeline);

    await pipeline.updatePipelineById(obj.id, {
      dataCollect: 'updated',
      modelTrain: 'updated'
    });

    const p1 = await pipeline.getPipeline(obj.id);
    assert.ok(p1.dataCollect === 'updated');
    assert.ok(p1.modelTrain === 'updated');

    // clean
    await pipeline.removePipelineById(obj.id);
  });
});
