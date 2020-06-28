import { app, assert } from 'midway-mock/bootstrap';
import { PipelineService } from '../../src/service/pipeline';

describe('test the pipeline service', () => {
  it('#create pipeline and get created pipeline', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline({
      dataCollect: 'dataCollect',
      dataAccess: 'dataAccess',
      dataProcess: 'dataProcess',
      modelDefine: 'modelDefine',
      modelTrain: 'modelTrain',
      modelEvaluate: 'modelEval'
    });

    const p1 = await pipeline.getPipeline(obj.id);
    assert(p1.id === obj.id, 'found the pipeline by created id');
    assert(p1.dataCollect === 'dataCollect');
    await pipeline.removePipelineById(obj.id);
    
    console.log('removed and query');
    const notExists = await pipeline.getPipeline(obj.id);
    assert(notExists == null);
  });

  it('#update pipeline', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline({
      dataCollect: 'dataCollect',
      dataAccess: 'dataAccess',
      dataProcess: 'dataProcess',
      modelDefine: 'modelDefine',
      modelTrain: 'modelTrain',
      modelEvaluate: 'modelEval'
    });

    await pipeline.updatePipelineById(obj.id, {
      dataCollect: 'updated',
      modelTrain: 'updated'
    });

    const p1 = await pipeline.getPipeline(obj.id);
    assert(p1.dataCollect === 'updated');
    assert(p1.modelTrain === 'updated');

    // clean
    await pipeline.removePipelineById(obj.id);
  });
});
