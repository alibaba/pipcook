import {
  createStubInstance,
  StubbedInstanceWithSinonAccessor,
  sinon
} from '@loopback/testlab';
import test from 'ava';
import { PluginRepository } from '../../../repositories';
import { Plugin } from '../../../models';
import { PluginService, TraceService, Tracer } from '../../../services';
import * as fs from 'fs-extra';

function initPluginService(): {
  pluginRepository: StubbedInstanceWithSinonAccessor<PluginRepository>,
  traceService: StubbedInstanceWithSinonAccessor<TraceService>,
  pluginService: PluginService
  } {
  const pluginRepository = createStubInstance<PluginRepository>(PluginRepository);
  const traceService = createStubInstance<TraceService>(TraceService);
  const pluginService = new PluginService(pluginRepository, traceService);
  return {
    pluginRepository,
    traceService,
    pluginService
  };
}

test('get datasetRoot', async (t) => {
  const { pluginService } = initPluginService();
  sinon.replace(pluginService.costa.options, 'datasetDir', 'mockPath');
  t.is(pluginService.datasetRoot, 'mockPath');
});

test('create or find by package: plugin exists', async (t) => {
  const { pluginRepository, pluginService } = initPluginService();
  const mockPlugin = { name: 'mockName' };
  const mockFindOne = pluginRepository.stubs.findOne.resolves(mockPlugin as any);
  const exsits = await pluginService.findOrCreateByPkg({ name: 'mockName' } as any);
  t.true(mockFindOne.calledOnce);
  t.deepEqual(exsits, mockPlugin as any);
});

test('create or find by package: plugin not exists', async (t) => {
  const { pluginRepository, pluginService } = initPluginService();
  const mockPlugin = {
    name: 'mockName',
    version: 'mockVersion',
    category: 'category',
    datatype: 'datatype',
    pipcook: {
      target: {
        DESTPATH: 'destPath'
      },
      source: {
        from: 'from',
        uri: 'uri'
      }
    }
  };
  const mockFindOne = pluginRepository.stubs.findOne.resolves();
  const mockCreate = pluginRepository.stubs.create.resolves({ name: 'mockName' } as any);
  const newPlugin = await pluginService.findOrCreateByPkg(mockPlugin as any);
  t.true(mockFindOne.calledOnce);
  t.true(mockCreate.calledOnce);
  t.deepEqual(newPlugin, { name: 'mockName' } as any);
});

test('should fetch plugin by name', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService.costa, 'fetch').resolves({ name: 'mockName' } as any);
  t.deepEqual(await pluginService.fetch('mockName'), { name: 'mockName' } as any, 'result check');
  t.true(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
});

test('should fetch plugin by stream', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService.costa, 'fetchByStream').resolves({ name: 'mockName' } as any);
  const stream = fs.createReadStream(__filename);
  t.deepEqual(await pluginService.fetchByStream(stream), { name: 'mockName' } as any, 'result check');
  t.true(mockFetch.calledOnceWith(stream), 'mockFetch check');
});

test('should fetch from installed plugin', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService.costa, 'fetchFromInstalledPlugin').resolves({ name: 'mockName' } as any);
  t.deepEqual(await pluginService.fetchFromInstalledPlugin('mockName'), { name: 'mockName' } as any, 'result check');
  t.true(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
});

test('should fetch and install -- installed', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 1 /* installed */ } as any);
  t.deepEqual(await pluginService.fetchAndInstall('mockName', {
    getLogger: () => {
      return { stdout: 'mockStdout', stderr: 'mockStderr' };
    }
  } as any, 'mockPyIndex'), { id: 'mockId', name: 'mockName' } as any, 'result check');
  t.true(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
  t.true(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
});

test('should fetch and install -- not installed', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 2 /* FAILED */ } as any);
  const mockInstall = sinon.stub(pluginService, 'install').resolves({ name: 'mockName' } as any);
  t.deepEqual(await pluginService.fetchAndInstall('mockName', {
    getLogger: () => {
      return { stdout: 'mockStdout', stderr: 'mockStderr' };
    }
  } as any, 'mockPyIndex'), { id: 'mockId', name: 'mockName' } as any, 'result check');
  t.true(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
  t.true(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
  t.true(mockSetStatusById.calledOnceWith('mockId', 1 /* installed */), 'check mockSetStatusById');
  t.true(mockInstall.calledOnceWith(
    'mockId',
    { id: 'mockId', name: 'mockName' } as any,
    { pyIndex: 'mockPyIndex', force: false, stderr: 'mockStderr', stdout: 'mockStdout' } as any
  ));
});

test('should fetch and install -- throw error', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 2 /* FAILED */ } as any);
  const mockInstall = sinon.stub(pluginService, 'install').rejects(new Error('mock error message'));
  let catched = false;
  try {
    await pluginService.fetchAndInstall('mockName', {
      getLogger: () => {
        return { stdout: 'mockStdout', stderr: 'mockStderr' };
      }
    } as any, 'mockPyIndex');
  } catch (err) {
    catched = true;
    t.is('mock error message', err.message, 'error message check');
  }
  t.true(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
  t.true(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
  t.true(mockSetStatusById.called, 'check mockSetStatusById');
  t.true(mockInstall.calledOnceWith(
    'mockId',
    { id: 'mockId', name: 'mockName' } as any,
    { pyIndex: 'mockPyIndex', force: false, stderr: 'mockStderr', stdout: 'mockStdout' } as any
  ));
  t.true(catched, 'error check');
});

test('should create runnable', async (t) => {
  const { pluginService } = initPluginService();
  const mockCreateRunnable = sinon.stub(pluginService.costa, 'createRunnable').resolves({ id: 'mockId' } as any);
  t.deepEqual(await pluginService.createRunnable('mockId', { getLogger: () => { return {}; } } as any), { id: 'mockId' } as any, 'result check');
  t.true(mockCreateRunnable.calledOnceWith({ id: 'mockId', logger: {} } as any), 'mockCreateRunnable check');
});

test('should find plugin by id', async (t) => {
  const { pluginRepository, pluginService } = initPluginService();
  pluginRepository.stubs.updateById.resolves();
  await pluginService.setStatusById('mockId', 1 /* installed */, 'error message');
  t.true(pluginRepository.stubs.updateById.calledOnceWith('mockId', { status: 1, error: 'error message' }), 'mockSetStatusById check');
});

test('should install plugin', async (t) => {
  const { pluginService } = initPluginService();
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockCostaInstall = sinon.stub(pluginService.costa, 'install').resolves();
  await pluginService.install('mockId', { name: 'mockName' } as any, {} as any);
  t.true(mockSetStatusById.calledOnceWith('mockId', 0 /* not installed */), 'mockSetStatusById check');
  t.true(mockCostaInstall.calledOnceWith({ name: 'mockName' } as any, {} as any), 'mockCostaInstall check');
});

test('install plugin but error happens', async (t) => {
  const { pluginService } = initPluginService();
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockCostaInstall = sinon.stub(pluginService.costa, 'install').rejects(new Error('mock error message'));
  const mockCostaUninstall = sinon.stub(pluginService.costa, 'uninstall').resolves();
  let catched = false;
  try {
    await pluginService.install('mockId', { name: 'mockName' } as any, {} as any);
  } catch (err) {
    catched = true;
    t.is(err.message, 'mock error message', 'check error message');
  }
  t.true(mockSetStatusById.calledOnceWith('mockId', 0 /* installed */), 'mockSetStatusById check');
  t.true(mockCostaInstall.calledOnceWith({ name: 'mockName' } as any, {} as any), 'mockCostaInstall check');
  t.true(mockCostaUninstall.calledOnceWith({ name: 'mockName' } as any), 'mockCostaUninstall check');
  t.true(catched, 'error check');
});

test('should install at next tick', async (t) => {
  const { traceService, pluginService } = initPluginService();
  const mockPlugin = createStubInstance<Plugin>(Plugin);
  mockPlugin.id = 'mockId';
  mockPlugin.status = 2; /* FAILED */
  const mockTracer = createStubInstance<Tracer>(Tracer);
  mockTracer.id = 'mockTracerId';
  mockTracer.stubs.getLogger.returns({});
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves(mockPlugin);
  const mockTracerCreate = traceService.stubs.create.returns(mockTracer);
  const mockTracerDestory = traceService.stubs.destroy.resolves();
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockInstall = sinon.stub(pluginService, 'install').resolves();
  const tracer = await pluginService.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false);
  t.truthy(tracer.traceId, 'should have traceId');
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      t.true(mockSetStatusById.called, 'mockSetStatusById check');
      t.true(mockInstall.calledOnce, 'mockInstall check');
      t.is(mockInstall.args[0][0], 'mockId', 'mockInstall args[0] check');
      t.deepEqual(mockInstall.args[0][1], { name: 'mockName' } as any, 'mockInstall args[1] check');
      t.deepEqual(mockInstall.args[0][2].pyIndex, 'mockPyIndex', 'mockInstall pyIndex check');
      t.deepEqual(mockInstall.args[0][2].force, false, 'mockInstall force check');
      t.true(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
      t.true(mockTracerCreate.calledOnce);
      t.true(mockTracerDestory.calledOnce);
      resolve();
    }, 10);
  });
});

test('install at next tick with error', async (t) => {
  const { traceService, pluginService } = initPluginService();
  const mockPlugin = createStubInstance<Plugin>(Plugin);
  mockPlugin.id = 'mockId';
  mockPlugin.status = 2; /* FAILED */
  const mockTracer = createStubInstance<Tracer>(Tracer);
  mockTracer.id = 'mockTracerId';
  mockTracer.stubs.getLogger.returns({});
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves(mockPlugin);
  const mockSetStatusById = sinon.stub(pluginService, 'setStatusById').resolves();
  const mockInstall = sinon.stub(pluginService, 'install').rejects(new Error('mock error message'));
  const mockTracerCreate = traceService.stubs.create.returns(mockTracer);
  const mockTracerDestory = traceService.stubs.destroy.resolves();
  const tracer = await pluginService.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false);
  t.is(tracer.traceId, 'mockTracerId', 'should have traceId');
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      t.true(mockSetStatusById.called, 'mockSetStatusById check');
      t.true(mockInstall.calledOnce, 'mockInstall check');
      t.is(mockInstall.args[0][0], 'mockId', 'mockInstall args[0] check');
      t.deepEqual(mockInstall.args[0][1], { name: 'mockName' } as any, 'mockInstall args[1] check');
      t.deepEqual(mockInstall.args[0][2].pyIndex, 'mockPyIndex', 'mockInstall pyIndex check');
      t.deepEqual(mockInstall.args[0][2].force, false, 'mockInstall force check');
      t.true(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
      t.true(mockTracerCreate.calledOnce);
      t.true(mockTracerDestory.calledOnce);
      resolve();
    }, 10);
  });
});

test('install at next tick but plugin has not been installed', async (t) => {
  const { pluginService } = initPluginService();
  const mockFindOrCreateByPkg = sinon.stub(pluginService, 'findOrCreateByPkg').resolves(
    { id: 'mockId', status: 1 /* INSTALLED */ } as any
  );
  t.deepEqual(
    await pluginService.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false),
    {
      id: 'mockId',
      status: 1
    } as any
  );
  t.true(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
});

test('should install by name', async (t) => {
  const { pluginService } = initPluginService();
  const mockFetch = sinon.stub(pluginService, 'fetch').resolves(
    { name: 'mockName' } as any
  );
  const mockInstallAtNextTick = sinon.stub(pluginService, 'installAtNextTick').resolves(
    { traceId: 'mockTraceId' } as any
  );
  await pluginService.installByName('mockName', 'mockPyIndex', false);
  t.true(mockFetch.calledOnceWith('mockName'));
  t.true(mockInstallAtNextTick.calledOnceWith({ name: 'mockName' } as any, 'mockPyIndex', false), 'mockInstallAtNextTick check');
});

test('should uninstall plugin', async (t) => {
  const { pluginRepository, pluginService } = initPluginService();
  const mockUninstall = sinon.stub(pluginService.costa, 'uninstall').resolves();
  const mockRemoveById = pluginRepository.stubs.deleteById.resolves();
  await pluginService.uninstall({ id: 'mockId' } as any);
  t.true(mockUninstall.calledOnceWith({ id: 'mockId' } as any), 'mockUninstall check');
  t.true(mockRemoveById.calledOnceWith('mockId'), 'mockRemoveById check');
});

test('should uninstall plugins', async (t) => {
  const { pluginRepository, pluginService } = initPluginService();
  const mockUninstall = sinon.stub(pluginService.costa, 'uninstall').resolves();
  const mockRemoveById = pluginRepository.stubs.deleteById.resolves();
  await pluginService.uninstall([ { id: 'mockId1' }, { id: 'mockId2' } ] as any);
  t.true(mockUninstall.calledOnceWith([ { id: 'mockId1' }, { id: 'mockId2' } ] as any), 'mockUninstall check');
  t.true(mockRemoveById.calledTwice, 'mockRemoveById check');
  t.deepEqual(mockRemoveById.args[0][0], 'mockId1', 'mockRemoveById args[0] check');
  t.deepEqual(mockRemoveById.args[1][0], 'mockId2', 'mockRemoveById args[1] check');
});

test('should install from tarball stream', async (t) => {
  const { pluginService } = initPluginService();
  const stream = fs.createReadStream(__filename);
  const mockFetch = sinon.stub(pluginService, 'fetchByStream').resolves(
    { name: 'mockName' } as any
  );
  const mockInstallAtNextTick = sinon.stub(pluginService, 'installAtNextTick').resolves(
    { traceId: 'mockTraceId' } as any
  );
  t.deepEqual(
    await pluginService.installFromTarStream(
      stream, 'mockPyIndex',
      false
    ),
    { traceId: 'mockTraceId' } as any,
    'result check'
  );
  t.true(mockFetch.calledOnceWith(stream));
  t.true(mockInstallAtNextTick.calledOnceWith({ name: 'mockName' } as any, 'mockPyIndex', false), 'mockInstallAtNextTick check');
});
