import * as sinon from 'sinon';
import * as fs from 'fs-extra';
// import * as ChileProcess from 'child_process';
// import * as core from '@pipcook/pipcook-core';
// import { PluginPackage } from '@pipcook/costa';
// import * as path from 'path';
import { app, assert, mm } from 'midway-mock/bootstrap';
import { PluginManager } from '../../src/service/plugin';
// import { Tracer } from '../../src/service/trace-manager';
// import { JobModel, JobEntity } from '../../src/model/job';
// import { PluginEntity } from '../../src/model/plugin';

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
});
