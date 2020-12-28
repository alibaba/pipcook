
import { StubbedInstanceWithSinonAccessor, createStubInstance } from '@loopback/testlab';
import test from 'ava';
import { PipelineController } from '../../../controllers';
import { PluginRepository, JobRepository, PipelineRepository } from '../../../repositories';
import { PluginService, TraceService, PipelineService, JobService } from '../../../services';
import * as createError from 'http-errors';
import { PluginStatus } from '@pipcook/pipcook-core';

function initPipelineController(): {
  pluginService: StubbedInstanceWithSinonAccessor<PluginService>,
  traceService: StubbedInstanceWithSinonAccessor<TraceService>,
  pluginRepository: StubbedInstanceWithSinonAccessor<PluginRepository>,
  jobRepository: StubbedInstanceWithSinonAccessor<JobRepository>,
  pipelineRepository: StubbedInstanceWithSinonAccessor<PipelineRepository>,
  pipelineService: StubbedInstanceWithSinonAccessor<PipelineService>,
  jobService: StubbedInstanceWithSinonAccessor<JobService>,
  pipelineController: PipelineController
  } {
  const pluginRepository = createStubInstance<PluginRepository>(PluginRepository);
  const pluginService = createStubInstance<PluginService>(PluginService);
  const traceService = createStubInstance<TraceService>(TraceService);
  const jobRepository = createStubInstance<JobRepository>(JobRepository);
  const pipelineRepository = createStubInstance<PipelineRepository>(PipelineRepository);
  const pipelineService = createStubInstance<PipelineService>(PipelineService);
  const jobService = createStubInstance<JobService>(JobService);

  const pipelineController = new PipelineController(
    jobRepository,
    pipelineRepository,
    pluginRepository,
    pluginService,
    pipelineService,
    jobService,
    traceService
  );

  return {
    jobRepository,
    pipelineRepository,
    pluginRepository,
    pluginService,
    pipelineService,
    jobService,
    traceService,
    pipelineController
  };
}

const pipelineMock = {
  dataCollect: {
    package: 'mockDataCollect',
    params: {}
  },
  dataAccess: {
    package: 'mockDataAccess',
    params: {}
  },
  dataProcess: {
    package: 'mockDataProcess',
    params: {}
  },
  datasetProcess: {
    package: 'mockDatasetProcess',
    params: {}
  },
  modelDefine: {
    package: 'mockModelDefine',
    params: {}
  },
  modelTrain: {
    package: 'mockModelTrain',
    params: {}
  },
  modelEvaluate: {
    package: 'mockModelEvaluate',
    params: {}
  }
};

const createPipelineParams = {
  config: {
    plugins: pipelineMock
  }
};

test('create the pipeline with the given config file', async (t) => {
  const { pipelineController, pluginService, pipelineService } = initPipelineController();
  pluginService.stubs.findByName.resolves(null);
  pluginService.stubs.fetch.resolves({} as any);
  pluginService.stubs.findOrCreateByPkg.resolves({
    id: 'mockId',
    name: 'mockName'
  } as any);
  pipelineService.stubs.createPipeline.resolves({
    id: 'mockId'
  } as any);
  const createPipelineResp = await pipelineController.create(createPipelineParams as any);
  const result = { id: 'mockId', plugins: Array(7).fill({ id: 'mockId', name: 'mockName' }) };
  t.deepEqual(createPipelineResp, result);
});

test('throws error when the config is missing', async (t) => {
  const { pipelineController } = initPipelineController();
  await t.throwsAsync(pipelineController.create({} as any), {
    instanceOf: createError.BadRequest, message: 'must provide configUri or config'
  }, 'throws error when the config is missing');
});

test('list the pipelines', async (t) => {
  const { pipelineController, pipelineService } = initPipelineController();
  pipelineService.stubs.queryPipelines.resolves([]);
  const pipelines = await pipelineController.list('mock', 'mock');
  t.deepEqual(pipelines, []);
});

test('remove all pipelines', async (t) => {
  const { pipelineController, pipelineService, jobRepository, jobService } = initPipelineController();
  jobRepository.stubs.find.resolves([]);
  jobService.stubs.removeJobByEntities.resolves();
  pipelineService.stubs.removeAllPipelines.resolves();
  await pipelineController.removeAll();
  t.true(jobRepository.stubs.find.calledOnce);
  t.true(jobService.stubs.removeJobByEntities.calledOnce);
  t.true(pipelineService.stubs.removeAllPipelines.calledOnce);
});

test('delete pipeline by id', async (t) => {
  const { pipelineController, pipelineService, jobService } = initPipelineController();
  jobService.stubs.removeJobByEntities.resolves();
  pipelineService.stubs.queryJobs.resolves();
  pipelineService.stubs.removePipelineById.resolves();
  await pipelineController.deleteById('mockId');
  t.true(jobService.stubs.removeJobByEntities.calledOnce);
  t.true(pipelineService.stubs.queryJobs.calledOnce);
  t.true(pipelineService.stubs.removePipelineById.calledOnce);
});

test('get the config by pipeline id', async (t) => {
  const { pipelineController, pipelineRepository } = initPipelineController();
  pipelineRepository.stubs.findById.resolves({
    dataCollect: 'mockDataCollect',
    dataCollectId: 'mockId',
    dataCollectParams: 'mockDataCollectParams'
  });
  const config = await pipelineController.getConfig('mockId');
  t.deepEqual(config, {
    plugins: {
      dataCollect: {
        package: 'mockDataCollect',
        params: 'mockDataCollectParams'
      }
    }
  });
});

test('get pipeline by pipelien id', async (t) => {
  const { pipelineController, pipelineRepository, pluginService } = initPipelineController();
  pipelineRepository.stubs.findById.resolves({
    toJSON: () => ({
      id: 'mockId'
    })
  } as any);
  pluginService.stubs.findByIds.resolves([]);
  const pipeline = await pipelineController.get('mockId');
  t.is(pipeline.id, 'mockId');
  t.deepEqual(pipeline.plugins, []);
});

test('update pipeline by pipeline id', async (t) => {
  const { pipelineController, pipelineRepository } = initPipelineController();
  pipelineRepository.stubs.updateById.resolves({} as any);
  await pipelineController.update('mockId', createPipelineParams as any);
  t.true(pipelineRepository.stubs.updateById.calledOnce);
});

test('install the pipeline by pipeline id', async (t) => {
  const { pipelineController, pipelineRepository, traceService, pluginService } = initPipelineController();
  pipelineRepository.stubs.findById.resolves({
    ...pipelineMock,
    toJSON: () => ({
      id: 'mockId'
    })
  } as any);
  pluginService.stubs.findByName
    .onFirstCall().resolves({ status: PluginStatus.INSTALLED } as any)
    .resolves(null);
  pluginService.stubs.fetch.resolves();
  pluginService.stubs.findOrCreateByPkg.resolves();
  pluginService.stubs.install.resolves();
  pluginService.stubs.setStatusById.resolves();
  traceService.stubs.create.resolves({
    stdout: {
      writeLine: () => { return 0; }
    }
  });
  traceService.stubs.destroy.resolves();
  const installResp = await pipelineController.installById('mockId', {} as any);
  t.is(installResp.id, 'mockId');
});
