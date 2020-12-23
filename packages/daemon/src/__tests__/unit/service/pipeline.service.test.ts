import {
  createStubInstance,
  StubbedInstanceWithSinonAccessor
} from '@loopback/testlab';
import test from 'ava';
import { PluginRepository, PipelineRepository, JobRepository } from '../../../repositories';
import { PipelineService, PluginService } from '../../../services';

function initPipelineService(): {
  pluginRepository: StubbedInstanceWithSinonAccessor<PluginRepository>,
  pluginService: StubbedInstanceWithSinonAccessor<PluginService>
  pipelineRepository: StubbedInstanceWithSinonAccessor<PipelineRepository>
  pipelineService: PipelineService

} {
  const pluginRepository = createStubInstance<PluginRepository>(PluginRepository);
  const pluginService = createStubInstance<PluginService>(PluginService);
  const pipelineRepository = createStubInstance<PipelineRepository>(PipelineRepository);
  const jobRepository = createStubInstance<JobRepository>(JobRepository);
  const pipelineService = new PipelineService(pluginService, pipelineRepository, jobRepository, pluginRepository);
  return {
    pluginRepository,
    pluginService,
    pipelineRepository,
    pipelineService
  }
}

test('get pipeline by id or name', async (t) => {
  const { pipelineService, pipelineRepository } = initPipelineService();
  pipelineRepository.stubs.findOne.resolves(null);
  t.is(await pipelineService.getPipelineByIdOrName('mockIdOrName'), null);
  t.deepEqual(pipelineRepository.stubs.findOne.args, [[{ where: { or: [{ id: 'mockIdOrName' }, { name: 'mockIdOrName' }] } }]]);
});

test('should fech plugins', async (t) => {
  const { pipelineService, pluginRepository, pluginService } = initPipelineService();
  const mockFindOne = pluginRepository.stubs.findOne.resolves({ name: 'mockDataCollect', status: 1 /* installed */} as any);
  const mockFetchFromInstalledPlugin = pluginService.stubs.fetchFromInstalledPlugin.resolves({} as any);
  const plugins = await pipelineService.fetchPlugins({ dataCollectId: 'mockDataCollectId', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any);
  t.deepEqual(plugins, { dataCollect: { plugin: {}, params: '{}' } } as any);
  t.true(mockFindOne.calledOnceWith({ where: { id: 'mockDataCollectId' }})), 'mockFindOne check';
  t.true(mockFetchFromInstalledPlugin.calledOnceWith('mockDataCollect')), 'mockFetchFromInstalledPlugin check';
});

test('fech plugins but plugin not installed - id is null', async (t) => {
  const { pipelineService } = initPipelineService();
  await t.throwsAsync(pipelineService.fetchPlugins({ dataCollectId: '', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any));
});

test('fech plugins but plugin not installed - plugin status error', async (t) => {
  const { pipelineService, pluginRepository } = initPipelineService();
  const mockFindOne = pluginRepository.stubs.findOne.resolves({ name: 'mockDataCollect', status: 2 /* FAILED */} as any);
  await t.throwsAsync(pipelineService.fetchPlugins({ dataCollectId: 'mockDataCollectId', dataCollect: 'mockDataCollect', dataCollectParams: '{}' } as any));
  t.true(mockFindOne.calledOnceWith({ where: { id: 'mockDataCollectId' }})), 'mockFindById check';
});
