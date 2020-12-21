
import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance
} from '@loopback/testlab';
import test from 'ava';
import { JobController } from '../../../controllers';
import { JobRepository } from '../../../repositories';
import { JobService, TraceService } from '../../../services';


function initJobController(): {
  JobService: StubbedInstanceWithSinonAccessor<JobService>,
  TraceService: StubbedInstanceWithSinonAccessor<TraceService>,
  JobRepository: StubbedInstanceWithSinonAccessor<JobRepository>,
  jobController: JobController
} {
  const jobRepository = createStubInstance<JobRepository>(JobRepository);
  const jobService = createStubInstance<JobService>(JobService);
  const traceService = createStubInstance<TraceService>(TraceService);
  const pluginController = new JobController(jobService, traceService, jobRepository);
  return {
    jobRepository,
    pluginService,
    traceService,
    pluginController
  }
}
const mockPluginJson = { name: 'mockPluginName', version: '1.0.0' };

test('find an existing plugin', async t => {
  const { pluginRepository, pluginController } = initPluginController();
  const mockPluginEntity = {id: '123', name: 'Pen', version: 'pen', sourceFrom: ''};
  const mockPlugin = new Plugin(mockPluginEntity);

  pluginRepository.stubs.findById.resolves(mockPlugin);

  const details = await pluginController.findById('123');

  t.deepEqual(details.toJSON(), mockPluginEntity);
  t.true(pluginRepository.stubs.findById.calledOnce);
});

test('find a nonexistent plugin', async t => {
  const { pluginRepository, pluginController } = initPluginController();

  pluginRepository.stubs.findById.resolves(undefined);

  const details = await pluginController.findById('nonexsitentId');

  t.is(details, undefined);
  t.true(pluginRepository.stubs.findById.calledOnce);
});

test('create plugin', async t => {
  const { pluginService, pluginController } = initPluginController();
  const mockPlugin = { name: 'mockPluginName' };

  pluginService.stubs.installByName.resolves(mockPlugin as any);

  const plugin = await pluginController.create({ name: 'mockName', pyIndex: 'mockPyIndex' });

  t.deepEqual(plugin, mockPlugin);
  t.true(pluginService.stubs.installByName.calledOnce);
});

test('reinstall plugin', async t => {
  const { pluginService, pluginController } = initPluginController();

  pluginService.stubs.installByName.resolves(mockPluginJson as any);

  const plugin = await pluginController.reInstallByName({ name: 'mockName', pyIndex: 'mockPyIndex' });

  t.deepEqual(plugin, mockPluginJson);
  t.true(pluginService.stubs.installByName.calledOnce);
});

test('remove plugin by id', async t => {
  const { pluginService, pluginRepository, pluginController } = initPluginController();

  pluginService.stubs.uninstall.resolves();
  pluginRepository.stubs.findById.resolves(mockPluginJson as any);

  await pluginController.deleteById('mockId');

  t.true(pluginService.stubs.uninstall.calledOnceWith(mockPluginJson as any));
  t.true(pluginRepository.stubs.findById.calledOnceWith('mockId'));
});

test.todo('remove plugin by id but no entity found');

test('remove all plugins', async t => {
  const { pluginRepository, pluginService, pluginController } = initPluginController();
  const plugins = [ mockPluginJson as any ];

  pluginService.stubs.uninstall.resolves();
  pluginRepository.stubs.find.resolves(plugins);

  await t.notThrowsAsync(pluginController.removeAll(), 'remove all plugins');

  t.deepEqual(pluginService.stubs.uninstall.args, [[ plugins ]]);
  t.true(pluginRepository.stubs.find.calledOnceWith());
});

test('get plugin meta data from registy by name', async t => {
  const { pluginService, pluginController } = initPluginController();
  const pluginPackage = { name : 'mockPackageName' };

  pluginService.stubs.fetch.resolves(pluginPackage as any);

  await t.notThrowsAsync(pluginController.getMetadata('packageName'), 'get plugin meta data by name');

  t.deepEqual(pluginService.stubs.fetch.args, [[ 'packageName' ]]);
});

test('get plugin meta data by id', async t => {
  const { pluginRepository, pluginService, pluginController } = initPluginController();
  const pluginPackage = { name : 'mockPackageName' };

  pluginRepository.stubs.findById.resolves(mockPluginJson as any);
  pluginService.stubs.fetch.resolves(pluginPackage as any);

  await t.notThrowsAsync(pluginController.getMetadataById('mockId'), 'get plugin meata data by id');

  t.deepEqual(pluginService.stubs.fetch.args, [[ `${mockPluginJson.name}@${mockPluginJson.version}` ]]);
  t.deepEqual(pluginRepository.stubs.findById.args, [[ 'mockId' ]]);
});

test('list plugins', async t => {
  const { pluginRepository, pluginController } = initPluginController();
  const fileter = { where: { name: 'mockName' } };
  pluginRepository.stubs.find.resolves(mockPluginJson as any);
  
  await t.notThrowsAsync(pluginController.list(fileter), 'list plugins');

  t.deepEqual(pluginRepository.stubs.find.args, [[ fileter ]]);
});
