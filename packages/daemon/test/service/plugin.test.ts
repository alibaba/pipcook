import * as sinon from 'sinon';
import * as fs from 'fs-extra';
import { app, assert, mm } from 'midway-mock/bootstrap';
import { PluginManager } from '../../src/service/plugin';
import { PluginModel } from '../../src/model/plugin';

describe('test the plugin manager', () => {
  afterEach(() => {
    mm.restore();
    sinon.restore();
  })
  it('#get datasetRoot', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    sinon.replace(pluginManager.pluginRT.costa.options, 'datasetDir', 'mockPath');
    assert.equal(pluginManager.datasetRoot, 'mockPath');
  });
  it('#should fetch plugin by name', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager.pluginRT.costa, 'fetch').resolves({ name: 'mockName' } as any);
    assert.deepEqual(await pluginManager.fetch('mockName'), { name: 'mockName' }, 'result check');
    assert.ok(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
  });
  it('#should fetch plugin by stream', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager.pluginRT.costa, 'fetchByStream').resolves({ name: 'mockName' } as any);
    const stream = fs.createReadStream(__filename);
    assert.deepEqual(await pluginManager.fetchByStream(stream), { name: 'mockName' }, 'result check');
    assert.ok(mockFetch.calledOnceWith(stream), 'mockFetch check');
  });
  it('#should fetch from installed plugin', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager.pluginRT.costa, 'fetchFromInstalledPlugin').resolves({ name: 'mockName' } as any);
    assert.deepEqual(await pluginManager.fetchFromInstalledPlugin('mockName'), { name: 'mockName' }, 'result check');
    assert.ok(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
  });
  it('#should fetch and install -- installed', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 1 /* installed */ } as any);
    assert.deepEqual(await pluginManager.fetchAndInstall('mockName', {
      getLogger: () => {
        return { stdout: 'mockStdout', stderr: 'mockStderr' };
      }
    } as any, 'mockPyIndex'), { id: 'mockId', name: 'mockName' }, 'result check');
    assert.ok(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
    assert.ok(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
  });
  it('#should fetch and install -- not installed', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 2 /* FAILED */ } as any);
    const mockInstall = sinon.stub(pluginManager, 'install').resolves({ name: 'mockName' } as any);
    assert.deepEqual(await pluginManager.fetchAndInstall('mockName', {
      getLogger: () => {
        return { stdout: 'mockStdout', stderr: 'mockStderr' };
      }
    } as any, 'mockPyIndex'), { id: 'mockId', name: 'mockName' }, 'result check');
    assert.ok(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
    assert.ok(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
    assert.ok(mockSetStatusById.calledOnceWith('mockId', 1 /* installed */), 'check mockSetStatusById');
    assert.ok(mockInstall.calledOnceWith(
      'mockId',
      { id: 'mockId', name: 'mockName' } as any,
      { pyIndex: 'mockPyIndex', force: false, stderr: 'mockStderr', stdout: 'mockStdout' } as any)
    );
  });
  it('#should fetch and install -- throw error', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager, 'fetch').resolves({ id: 'mockId', name: 'mockName' } as any);
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves({ id: 'mockId', status: 2 /* FAILED */ } as any);
    const mockInstall = sinon.stub(pluginManager, 'install').rejects(new Error('mock error message'));
    let catched = false;
    try {
      await pluginManager.fetchAndInstall('mockName', {
        getLogger: () => {
          return { stdout: 'mockStdout', stderr: 'mockStderr' };
        }
      } as any, 'mockPyIndex');
    } catch (err) {
      catched = true;
      assert.equal('mock error message', err.message, 'error message check');
    }
    assert.ok(mockFetch.calledOnceWith('mockName'), 'mockFetch check');
    assert.ok(mockFindOrCreateByPkg.calledOnceWith({ id: 'mockId', name: 'mockName' } as any), 'check mockFindOrCreateByPkg');
    assert.ok(mockSetStatusById.called, 'check mockSetStatusById');
    assert.ok(mockInstall.calledOnceWith(
      'mockId',
      { id: 'mockId', name: 'mockName' } as any,
      { pyIndex: 'mockPyIndex', force: false, stderr: 'mockStderr', stdout: 'mockStdout' } as any)
    );
    assert.ok(catched, 'error check');
  });
  it('#should create runnable', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockCreateRunnable = sinon.stub(pluginManager.pluginRT.costa, 'createRunnable').resolves({ id: 'mockId' } as any);
    assert.deepEqual(await pluginManager.createRunnable('mockId', { getLogger: () => { return {}; } } as any), { id: 'mockId' }, 'result check');
    assert.ok(mockCreateRunnable.calledOnceWith({ id: 'mockId', logger: {} } as any), 'mockCreateRunnable check');
  });
  it('#should find plugins by ids', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindByIds = sinon.stub(PluginModel, 'findByIds').resolves([{ id: 'mockId1' }, { id: 'mockId2' }] as any);
    assert.deepEqual(await pluginManager.findByIds([ 'mockId1', 'mockId2' ]), [{ id: 'mockId1' }, { id: 'mockId2' }], 'result check');
    assert.ok(mockFindByIds.calledOnceWith([ 'mockId1', 'mockId2' ]), 'mockFindByIds check');
  });
  it('#should find plugin by name', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindByName = sinon.stub(PluginModel, 'findByName').resolves({ id: 'mockId' } as any);
    assert.deepEqual(await pluginManager.findByName('mockName'), { id: 'mockId' }, 'result check');
    assert.ok(mockFindByName.calledOnceWith('mockName'), 'mockFindByName check');
  });
  it('#should find plugin by id', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindById = sinon.stub(PluginModel, 'findById').resolves({ id: 'mockId' } as any);
    assert.deepEqual(await pluginManager.findById('mockId'), { id: 'mockId' }, 'result check');
    assert.ok(mockFindById.calledOnceWith('mockId'), 'mockFindById check');
  });
  it('#should find plugin by id', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockSetStatusById = sinon.stub(PluginModel, 'setStatusById').resolves(1);
    assert.deepEqual(await pluginManager.setStatusById('mockId', 1 /* installed */), 1, 'result check');
    assert.ok(mockSetStatusById.calledOnceWith('mockId', 1), 'mockSetStatusById check');
  });
  it('#should remove plugin by id', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockRemoveById = sinon.stub(PluginModel, 'removeById').resolves(1);
    assert.deepEqual(await pluginManager.removeById('mockId'), 1, 'result check');
    assert.ok(mockRemoveById.calledOnceWith('mockId'), 'mockRemoveById check');
  });
  it('#should find or create plugin', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindOrCreateByPkg = sinon.stub(PluginModel, 'findOrCreateByParams').resolves({ id: 'mockId' } as any);
    let mockPlguin = {
      name: 'mockName',
      version: 'mockVersion',
      pipcook: {
        category: 'mockCategory',
        datatype: 'mockDatatype',
        target: {
          DESTPATH: 'DESTPATH'
        },
        source: {
          from: 'from',
          uri: 'uri'
        }
      },
      status: 1
    };
    assert.deepEqual(await pluginManager.findOrCreateByPkg(mockPlguin as any), { id: 'mockId' }, 'result check');
    assert.ok(mockFindOrCreateByPkg.called, 'mockFindOrCreateByPkg check');
    assert.equal((mockFindOrCreateByPkg.args[0][0] as any).name, 'mockName', 'mockFindOrCreateByPkg args check');
  });
  it('#should install plugin', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockCostaInstall = sinon.stub(pluginManager.pluginRT.costa, 'install').resolves();
    await pluginManager.install('mockId', { name: 'mockName' } as any, {} as any);
    assert.ok(mockSetStatusById.calledOnceWith('mockId', 0 /* installed */), 'mockSetStatusById check');
    assert.ok(mockCostaInstall.calledOnceWith({ name: 'mockName' } as any, {} as any), 'mockCostaInstall check');
  });
  it('#install plugin but error happens', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockCostaInstall = sinon.stub(pluginManager.pluginRT.costa, 'install').rejects(new Error('mock error message'));
    const mockCostaUninstall = sinon.stub(pluginManager.pluginRT.costa, 'uninstall').resolves();
    let catched = false;
    try {
      await pluginManager.install('mockId', { name: 'mockName' } as any, {} as any);
    } catch (err) {
      catched = true;
      assert.equal(err.message, 'mock error message', 'check error message');
    }
    assert.ok(mockSetStatusById.calledOnceWith('mockId', 0 /* installed */), 'mockSetStatusById check');
    assert.ok(mockCostaInstall.calledOnceWith({ name: 'mockName' } as any, {} as any), 'mockCostaInstall check');
    assert.ok(mockCostaUninstall.calledOnceWith({ name: 'mockName' } as any), 'mockCostaUninstall check');
    assert.ok(catched, 'error check');
  });
  it('#should install at next tick', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves(
      { id: 'mockId', status: 2 /* FAILED */ } as any
    );
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockInstall = sinon.stub(pluginManager, 'install').resolves();
    await pluginManager.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(mockSetStatusById.called, 'mockSetStatusById check');
        assert.ok(mockInstall.calledOnce, 'mockInstall check');
        assert.equal(mockInstall.args[0][0], 'mockId', 'mockInstall args[0] check');
        assert.deepEqual(mockInstall.args[0][1], { name: 'mockName' } as any, 'mockInstall args[1] check');
        assert.deepEqual(mockInstall.args[0][2].pyIndex, 'mockPyIndex', 'mockInstall pyIndex check');
        assert.deepEqual(mockInstall.args[0][2].force, false, 'mockInstall force check');
        assert.ok(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
        resolve();
      }, 10);
    });
  });
  it('#install at next tick with error', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves(
      { id: 'mockId', status: 2 /* FAILED */ } as any
    );
    const mockSetStatusById = sinon.stub(pluginManager, 'setStatusById').resolves();
    const mockInstall = sinon.stub(pluginManager, 'install').rejects(new Error('mock error message'));
    await pluginManager.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(mockSetStatusById.called, 'mockSetStatusById check');
        assert.ok(mockInstall.calledOnce, 'mockInstall check');
        assert.equal(mockInstall.args[0][0], 'mockId', 'mockInstall args[0] check');
        assert.deepEqual(mockInstall.args[0][1], { name: 'mockName' } as any, 'mockInstall args[1] check');
        assert.deepEqual(mockInstall.args[0][2].pyIndex, 'mockPyIndex', 'mockInstall pyIndex check');
        assert.deepEqual(mockInstall.args[0][2].force, false, 'mockInstall force check');
        assert.ok(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
        resolve();
      }, 10);
    });
  });
  it('#install at next tick but plugin has not been installed', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFindOrCreateByPkg = sinon.stub(pluginManager, 'findOrCreateByPkg').resolves(
      { id: 'mockId', status: 1 /* INSTALLED */ } as any
    );
    assert.deepEqual(
      await pluginManager.installAtNextTick({ name: 'mockName' } as any, 'mockPyIndex', false),
      {
        id: 'mockId',
        status: 1,
        traceId: ''
      }
    );
    assert.ok(mockFindOrCreateByPkg.calledOnceWith({ name: 'mockName' } as any));
  });
  it('#should install by name', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockFetch = sinon.stub(pluginManager, 'fetch').resolves(
      { name: 'mockName' } as any
    );
    const mockInstallAtNextTick = sinon.stub(pluginManager, 'installAtNextTick').resolves(
      { traceId: 'mockTraceId' } as any
    );
    await pluginManager.installByName('mockName', 'mockPyIndex', false);
    assert.ok(mockFetch.calledOnceWith('mockName'));
    assert.ok(mockInstallAtNextTick.calledOnceWith({ name: 'mockName' } as any, 'mockPyIndex', false), 'mockInstallAtNextTick check');
  });
  it('#should uninstall plugin', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockUninstall = sinon.stub(pluginManager.pluginRT.costa, 'uninstall').resolves();
    const mockRemoveById = sinon.stub(PluginModel, 'removeById').resolves(1);
    await pluginManager.uninstall({ id: 'mockId' } as any);
    assert.ok(mockUninstall.calledOnceWith({ id: 'mockId' } as any), 'mockUninstall check');
    assert.ok(mockRemoveById.calledOnceWith('mockId'), 'mockRemoveById check');
  });
  it('#should uninstall plugins', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const mockUninstall = sinon.stub(pluginManager.pluginRT.costa, 'uninstall').resolves();
    const mockRemoveById = sinon.stub(PluginModel, 'removeById').resolves(1);
    await pluginManager.uninstall([{ id: 'mockId1' }, { id: 'mockId2' }] as any);
    assert.ok(mockUninstall.calledOnceWith([{ id: 'mockId1' }, { id: 'mockId2' }] as any), 'mockUninstall check');
    assert.ok(mockRemoveById.calledTwice, 'mockRemoveById check');
    assert.deepEqual(mockRemoveById.args[0][0], 'mockId1', 'mockRemoveById args[0] check');
    assert.deepEqual(mockRemoveById.args[1][0], 'mockId2', 'mockRemoveById args[1] check');
  });
  it('#should install from tarball stream', async () => {
    const pluginManager: PluginManager = await app.applicationContext.getAsync<PluginManager>('pluginManager');
    const stream = fs.createReadStream(__filename);
    const mockFetch = sinon.stub(pluginManager, 'fetchByStream').resolves(
      { name: 'mockName' } as any
    );
    const mockInstallAtNextTick = sinon.stub(pluginManager, 'installAtNextTick').resolves(
      { traceId: 'mockTraceId' } as any
    );
    assert.deepEqual(
      await pluginManager.installFromTarStream(
        stream, 'mockPyIndex',
        false
      ),
      { traceId: 'mockTraceId' },
      'result check'
    );
    assert.ok(mockFetch.calledOnceWith(stream));
    assert.ok(mockInstallAtNextTick.calledOnceWith({ name: 'mockName' } as any, 'mockPyIndex', false), 'mockInstallAtNextTick check');
  });
});
