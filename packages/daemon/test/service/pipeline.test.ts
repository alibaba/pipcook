import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import * as ChileProcess from 'child_process';
import * as core from '@pipcook/pipcook-core';
import { PluginPackage } from '@pipcook/costa';
import * as path from 'path';
import { app, assert, mm } from 'midway-mock/bootstrap';
import { PipelineService } from '../../src/service/pipeline';
import { Tracer } from '../../src/service/trace-manager';
import { JobModel, JobEntity } from '../../src/model/job';
import { PipelineEntity } from '../../src/model/pipeline';

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
  });
  afterEach(() => {
    mm.restore();
    sinon.restore();
  })
  it('#create job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const obj = await pipeline.createPipeline(mockPipeline);
    const job = await pipeline.createJob(obj.id);
    const jobFromGet = await pipeline.getJobById(job.id);
    assert.equal(job.id, jobFromGet.id);
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

  it('#remove job by id', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockGetJobById = sinon.stub(JobModel, 'getJobById').resolves({ id: 'mockJobId' } as JobEntity);
    const mockRemoveJobById = sinon.stub(JobModel, 'removeJobById').resolves(1);
    const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
    assert.equal(await pipeline.removeJobById('mockJobId'), 1, 'check result');
    assert.ok(mockGetJobById.calledOnceWithExactly('mockJobId'), 'check mockGetJobById');
    assert.ok(mockRemoveJobById.calledOnceWithExactly('mockJobId'), 'check mockRemoveJobById');
    console.log(`${core.constants.PIPCOOK_RUN}/mockJobId`);
    // ts error for prarameter check: Expected 2 arguments, but got 1.ts(2554)
    // @ts-ignore
    assert.ok(mockFsRemove.calledOnceWith(`${core.constants.PIPCOOK_RUN}/mockJobId`), 'check mockFsRemove');
  });
  it('#remove job but id not found', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockGetJobById = sinon.stub(JobModel, 'getJobById').resolves(undefined);
    assert.equal(await pipeline.removeJobById('mockJobId'), 0, 'check result');
    assert.ok(mockGetJobById.calledOnceWithExactly('mockJobId'), 'check mockGetJobById');
  });
  it('#save job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockJob = {
      id: 'jobId'
    };
    const mockSaveJob = sinon.stub(JobModel, 'saveJob');
    assert.equal(await pipeline.saveJob(mockJob as JobEntity), undefined, 'check result');
    assert.ok(mockSaveJob.calledOnceWithExactly(mockJob as JobEntity), 'check mockSaveJob');
  });
  it('#get jobs by pipeline id', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockJobs = [
      {
       id: 'jobId1'
      },
      {
        id: 'jobId2'
      }
    ];
    const mockGetJobsByPipelineId = sinon.stub(JobModel, 'getJobsByPipelineId').resolves(mockJobs as JobEntity[]);
    assert.deepEqual(await pipeline.getJobsByPipelineId('mockPipelineId'), mockJobs, 'check result');
    assert.ok(mockGetJobsByPipelineId.calledOnceWithExactly('mockPipelineId'), 'check mockGetJobsByPipelineId');
  });
  it('#remove job by models', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockJobs = [
      {
        id: 'jobId1'
      },
      {
        id: 'jobId2'
      }
    ];
    const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
    const mockRemoveJobByModels = sinon.stub(JobModel, 'removeJobByModels').resolves(2);
    assert.equal(await pipeline.removeJobByModels(mockJobs as JobEntity[]), 2, 'check result');
    assert.ok(mockRemoveJobByModels.calledOnceWithExactly(mockJobs as JobEntity[]), 'check mockSaveJob');
    // TODO(Feely): check args
    assert.ok(mockFsRemove.calledTwice, 'check mockFsRemove');
  });
  it('#generate output', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    // @ts-ignore
    sinon.replace(ChileProcess, 'exec', (cmd, opts, cb) => {
      assert.equal(cmd, 'npm init -y', 'exec command check');
      assert.deepEqual(opts, { cwd: '/home/output' }, 'exec option check');
      cb();
    });
    const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
    const mockFsEnsureDir = sinon.stub(fs, 'ensureDir').resolves(true);
    const mockFsReadJson = sinon.stub(fs, 'readJSON').resolves({});
    const mockFsCopy = sinon.stub(fs, 'copy').resolves(true);
    const mockFsOutputJson = sinon.stub(fs, 'outputJSON').resolves({ });
    const mockFsCompressTarFile = sinon.stub(core, 'compressTarFile').resolves();

    await pipeline.generateOutput({ id: 'mockId' } as JobEntity, {
      modelPath: 'mockPath',
      plugins: {
        modelDefine: { name: 'modelPlugin', version: 'mockVersion' } as PluginPackage,
        dataProcess: {
          version: 'mockVersion',
          name: 'dataProcess'
        } as PluginPackage,
      },
      pipeline: {} as PipelineEntity,
      workingDir: '/home',
      template: 'mock template'
    });
    // @ts-ignore
    assert.ok(mockFsRemove.calledOnceWith('/home/output'), 'check mockFsRemove');
    assert.ok(mockFsEnsureDir.calledOnceWith('/home/output'), 'check mockFsEnsureDir');
    assert.ok(mockFsReadJson.called, 'check mockFsReadJson');
    assert.ok(mockFsCopy.called, 'check mockFsCopy');
    assert.ok(mockFsOutputJson.called, 'check mockFsOutputJson');
    assert.ok(mockFsCompressTarFile.calledOnceWith('/home/output', '/home/output.tar.gz'), 'check mockFsCompressTarFile');
  });
  it('#should get output tar by job id', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    assert.equal(pipeline.getOutputTarByJobId('mockId'), path.join(core.constants.PIPCOOK_RUN, 'mockId', 'output.tar.gz'));
  });
  it('#should get log by job id', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockFsPathExists = sinon.stub(fs, 'pathExists').resolves(true);
    const mockFsReadFile = sinon.stub(fs, 'readFile').resolves('test' as any);
    assert.deepEqual(await pipeline.getLogById('mockId'), [ 'test', 'test' ]);
    assert.ok(mockFsPathExists.called, 'mockFsPathExists check');
    assert.ok(mockFsReadFile.called, 'mockFsReadFile check');
  });
  it('#get log by job id but log not exists', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockFsPathExists = sinon.stub(fs, 'pathExists').resolves(false);
    let catched = false;
    try {
      await pipeline.getLogById('mockId');
    } catch (err) {
      catched = true;
      assert.equal(err.statusCode, 404);
    }
    assert.ok(mockFsPathExists.called, 'mockFsPathExists check');
    assert.ok(catched, 'error check');
  });
  it('#should run job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockSaveJob = sinon.stub(pipeline, 'saveJob').resolves();
    const mockStartJob = sinon.stub(pipeline, 'startJob').resolves();
    let cbCount1 = 0, cbCount2 = 0;
    const futures = [];

    futures.push(pipeline.runJob(
      { id: 'mockId' } as JobEntity,
      { id: 'mockPipelineId' } as PipelineEntity,
      { dataAccess: { plugin: {} as PluginPackage, params: '{}' }},
      {
        // if assert failed, it will make test timeout, because it's event listener
        dispatch: (event) => {
          assert.equal(event.type, 'job_status');
          if (cbCount1 === 0) {
            assert.deepEqual(event.data, {
              jobStatus: 1,
              queueLength: undefined,
              step: undefined,
              stepAction: undefined
            });
          } else if (cbCount1 === 1) {
            assert.deepEqual(event.data, {
              jobStatus: 4,
              queueLength: undefined,
              step: undefined,
              stepAction: undefined
            });
          }
          cbCount1++;
        },
        getLogger: () => {
          return {};
        }
      } as Tracer
    ));

    futures.push(pipeline.runJob(
      { id: 'mockId' } as JobEntity,
      { id: 'mockPipelineId' } as PipelineEntity,
      { dataAccess: { plugin: {} as PluginPackage, params: '{}' }},
      {
        // if assert failed, it will make test timeout, because it's event listener
        dispatch: (event) => {
          assert.equal(event.type, 'job_status');
          if (cbCount2 === 0) {
            assert.deepEqual(event.data, {
              jobStatus: 5,
              queueLength: 1,
              step: undefined,
              stepAction: undefined
            });
          } else if (cbCount2 === 1) {
            assert.deepEqual(event.data, {
              jobStatus: 5,
              queueLength: 0,
              step: undefined,
              stepAction: undefined
            });
          } else if (cbCount2 === 2) {
            assert.deepEqual(event.data, {
              jobStatus: 4,
              queueLength: undefined,
              step: undefined,
              stepAction: undefined
            });
          }
          cbCount2++;
        },
        getLogger: () => {
          return {};
        }
      } as Tracer
    ));

    await Promise.all(futures);
    assert.ok(mockSaveJob.calledWith({ id: 'mockId', status: 5 /* pending */} as JobEntity), 'mockSaveJob check');
    assert.ok(mockStartJob.calledTwice, 'mockStartJob check');
  });
  it('#run job with error', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockSaveJob = sinon.stub(JobModel, 'saveJob').resolves();
    const mockStartJob = sinon.stub(pipeline, 'startJob').rejects();
    let catched = false;
    try {
      await pipeline.runJob(
        { id: 'mockId' } as JobEntity,
        { id: 'mockPipelineId' } as PipelineEntity,
        { dataAccess: { plugin: {} as PluginPackage, params: '{}' }},
        {
          getLogger: () => {
            return {};
          }
        } as Tracer
      );
    } catch (err) {
      catched = true;
    }
    assert.ok(catched, 'error check');
    assert.ok(mockSaveJob.calledWith({ id: 'mockId', status: 5 /* pending */} as JobEntity), 'mockSaveJob check');
    assert.ok(mockStartJob.calledOnce, 'mockStartJob check');
  });
  it('#should stop job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockGetJobById = sinon.stub(JobModel, 'getJobById').resolves({ id: 'mockId', status: 1 /* running */ } as any);
    const mockSaveJob = sinon.stub(JobModel, 'saveJob').resolves();
    sinon.replace(pipeline, 'runnableMap', { mockId: { destroy: async () => {} } } as any);
    await pipeline.stopJob('mockId');
    assert.ok(mockSaveJob.calledOnceWith({ id: 'mockId', status: 4 /* canceled */} as JobEntity), 'mockSaveJob check');
    mockGetJobById.calledOnceWith('mockId');
  });
  it('#stop invalid job', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockGetJobById = sinon.stub(JobModel, 'getJobById').resolves({ id: 'mockId', status: 4 /* canceled */ } as any);
    let catched = false;
    try {
      await pipeline.stopJob('mockId');
    } catch (err) {
      catched = true;
    }
    assert.ok(catched, 'error check');
    mockGetJobById.calledOnceWith('mockId');
  });
  it('#should stop job without runnable', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockGetJobById = sinon.stub(JobModel, 'getJobById').resolves({ id: 'mockId', status: 1 /* running */ } as any);
    const mockSaveJob = sinon.stub(JobModel, 'saveJob').resolves();
    await pipeline.stopJob('mockId');
    assert.ok(mockSaveJob.calledOnceWith({ id: 'mockId', status: 4 /* canceled */} as JobEntity), 'mockSaveJob check');
    mockGetJobById.calledOnceWith('mockId');
  });
  it('#should fech plugins', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockFindById = sinon.stub(pipeline.pluginManager, 'findById').resolves({ name: 'mockDataCollect', status: 1 /* installed */} as any);
    const mockFetchFromInstalledPlugin = sinon.stub(pipeline.pluginManager, 'fetchFromInstalledPlugin').resolves({} as any);
    const plugins = await pipeline.fetchPlugins({ dataCollectId: 'mockDataCollectId', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any);
    assert.deepEqual(plugins, { dataCollect: { plugin: {}, params: '{}' } });
    assert.ok(mockFindById.calledOnceWith('mockDataCollectId')), 'mockFindById check';
    assert.ok(mockFetchFromInstalledPlugin.calledOnceWith('mockDataCollect')), 'mockFetchFromInstalledPlugin check';
  });
  it('#fech plugins but plugin not installed - id is null', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    let catched = false;
    try {
      await pipeline.fetchPlugins({ dataCollectId: '', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any);
    } catch (err) {
      catched = true;
    }
    assert.ok(catched, 'error check');
  });
  it('#fech plugins but plugin not installed - plugin status error', async () => {
    const pipeline: PipelineService = await app.applicationContext.getAsync<PipelineService>('pipelineService');
    const mockFindById = sinon.stub(pipeline.pluginManager, 'findById').resolves({ name: 'mockDataCollect', status: 2 /* FAILED */} as any);
    let catched = false;
    try {
      await pipeline.fetchPlugins({ dataCollectId: 'mockDataCollectId', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any);
    } catch (err) {
      catched = true;
    }
    assert.ok(mockFindById.calledOnceWith('mockDataCollectId')), 'mockFindById check';
    assert.ok(catched, 'error check');
  });
});
