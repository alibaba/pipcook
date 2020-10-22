import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import { app, assert } from 'midway-mock/bootstrap';
import DB from '../../src/boot/database';
import { PluginModel } from '../../src/model/plugin';

const testData = {
  name: 'name',
  version: 'version',
  category: 'categoryA',
  datatype: 'datatypeA',
  dest: 'dest',
  sourceFrom: 'sourceFrom',
  sourceUri: 'sourceUri',
  status: 0,
  error: 'error',
  namespace: 'namespace'
};
const anotherTestData = {
  ...testData,
  name: 'anotherName',
  category: 'categoryB',
  datatype: 'datatypeB'
};

function deepEqualPlugin(entity, originData) {
  delete entity['createdAt'];
  delete entity['updatedAt'];
  assert.deepStrictEqual(entity, originData);
}

describe('test the plugin manager', () => {
  before(async () => {
    const db = await app.applicationContext.getAsync<DB>('pipcookDB');
    await db.connect();
    await PluginModel.destroy({ truncate: true });
  });
  afterEach(() => {
    sinon.restore();
  });
  it('#should create by params', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('mockId');
    const plugin = await PluginModel.findOrCreateByParams(testData);
    deepEqualPlugin(plugin, { ...testData, id: 'mockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should get by params', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('anotherMockId');
    const plugin = await PluginModel.findOrCreateByParams(testData);
    deepEqualPlugin(plugin, { ...testData, id: 'mockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should create another plugin by params', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('anotherMockId');
    const plugin = await PluginModel.findOrCreateByParams(anotherTestData);
    deepEqualPlugin(plugin, { ...anotherTestData, id: 'anotherMockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should find by id', async () => {
    const plugin = await PluginModel.findById('mockId');
    deepEqualPlugin(plugin, { ...testData, id: 'mockId' });
  });
  it('#should find by prefix id', async () => {
    const pluginList = await PluginModel.findByPrefixId('mock');
    assert.strictEqual(pluginList.length, 1);
    deepEqualPlugin(pluginList[0], { ...testData, id: 'mockId' });
  });
  it('#should find by name', async () => {
    const plugin = await PluginModel.findByName('name');
    deepEqualPlugin(plugin, { ...testData, id: 'mockId' });
  });
  it('#should find by ids', async () => {
    const pluginList = await PluginModel.findByIds([ 'mockId', 'anotherMockId' ]);
    assert.strictEqual(pluginList.length, 2);
    let pluginA, pluginB;
    if (pluginList[0].id === 'mockId') {
      [ pluginA, pluginB ] = pluginList;
    } else {
      [ pluginB, pluginA ] = pluginList;
    }
    deepEqualPlugin(pluginA, { ...testData, id: 'mockId' });
    deepEqualPlugin(pluginB, { ...anotherTestData, id: 'anotherMockId' });
  });
  it('#should list plugins', async () => {
    const pluginList = await PluginModel.list();
    assert.strictEqual(pluginList.length, 2);
    let pluginA, pluginB;
    if (pluginList[0].id === 'mockId') {
      [ pluginA, pluginB ] = pluginList;
    } else {
      [ pluginB, pluginA ] = pluginList;
    }
    deepEqualPlugin(pluginA, { ...testData, id: 'mockId' });
    deepEqualPlugin(pluginB, { ...anotherTestData, id: 'anotherMockId' });
  });
  it('#should list plugins with filter', async () => {
    const pluginList = await PluginModel.list({ name: 'name' });
    assert.strictEqual(pluginList.length, 1);
    deepEqualPlugin(pluginList[0], { ...testData, id: 'mockId' });

    const pluginListCategory = await PluginModel.list({ category: 'categoryA' });
    assert.strictEqual(pluginListCategory.length, 1);
    deepEqualPlugin(pluginListCategory[0], { ...testData, id: 'mockId' });

    const pluginListDateType = await PluginModel.list({ datatype: 'datatypeB' });
    assert.strictEqual(pluginListDateType.length, 1);
    deepEqualPlugin(pluginListDateType[0], { ...anotherTestData, id: 'anotherMockId' });

    const pluginListNoneExists = await PluginModel.list({ datatype: 'nonexists' });
    assert.strictEqual(pluginListNoneExists.length, 0);
  });
  it('#should set status to 2 by id', async () => {
    assert.strictEqual(await PluginModel.setStatusById('mockId', 2, 'update error message'), 1);
    const plugin = await PluginModel.findById('mockId');
    deepEqualPlugin(plugin, { ...testData, id: 'mockId', status: 2, error: 'update error message' });
  });
  it('#should remove by id', async () => {
    assert.strictEqual(await PluginModel.removeById('mockId'), 1);
    assert.strictEqual(await PluginModel.findById('mockId'), undefined);
  });
  it('#should remove by id but id not found', async () => {
    assert.strictEqual(await PluginModel.removeById('mockId'), 0);
  });
});
