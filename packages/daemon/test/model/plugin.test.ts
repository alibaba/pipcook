import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import { app, assert } from 'midway-mock/bootstrap';
import DB from '../../src/boot/database';
import { PluginModel } from '../../src/model/plugin';
import { pluginData, anotherPluginData, deepEqualEntity } from './helper';

describe('test the plugin model', () => {
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
    const plugin = await PluginModel.findOrCreateByParams(pluginData);
    deepEqualEntity(plugin, { ...pluginData, id: 'mockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should get by params', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('anotherMockId');
    const plugin = await PluginModel.findOrCreateByParams(pluginData);
    deepEqualEntity(plugin, { ...pluginData, id: 'mockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should create another plugin by params', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('anotherMockId');
    const plugin = await PluginModel.findOrCreateByParams(anotherPluginData);
    deepEqualEntity(plugin, { ...anotherPluginData, id: 'anotherMockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should find by id', async () => {
    const plugin = await PluginModel.findById('mockId');
    deepEqualEntity(plugin, { ...pluginData, id: 'mockId' });
  });
  it('#should find by name', async () => {
    const plugin = await PluginModel.findByName('name');
    deepEqualEntity(plugin, { ...pluginData, id: 'mockId' });
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
    deepEqualEntity(pluginA, { ...pluginData, id: 'mockId' });
    deepEqualEntity(pluginB, { ...anotherPluginData, id: 'anotherMockId' });
  });
  it('#should list plugins', async () => {
    const pluginList = await PluginModel.query();
    assert.strictEqual(pluginList.length, 2);
    let pluginA, pluginB;
    if (pluginList[0].id === 'mockId') {
      [ pluginA, pluginB ] = pluginList;
    } else {
      [ pluginB, pluginA ] = pluginList;
    }
    deepEqualEntity(pluginA, { ...pluginData, id: 'mockId' });
    deepEqualEntity(pluginB, { ...anotherPluginData, id: 'anotherMockId' });
  });
  it('#should list plugins with filter', async () => {
    const pluginList = await PluginModel.query({ name: 'name' });
    assert.strictEqual(pluginList.length, 1);
    deepEqualEntity(pluginList[0], { ...pluginData, id: 'mockId' });

    const pluginListCategory = await PluginModel.query({ category: 'categoryA' });
    assert.strictEqual(pluginListCategory.length, 1);
    deepEqualEntity(pluginListCategory[0], { ...pluginData, id: 'mockId' });

    const pluginListDateType = await PluginModel.query({ datatype: 'datatypeB' });
    assert.strictEqual(pluginListDateType.length, 1);
    deepEqualEntity(pluginListDateType[0], { ...anotherPluginData, id: 'anotherMockId' });

    const pluginListNoneExists = await PluginModel.query({ datatype: 'nonexists' });
    assert.strictEqual(pluginListNoneExists.length, 0);
  });
  it('#should set status to 2 by id', async () => {
    assert.strictEqual(await PluginModel.setStatusById('mockId', 2, 'update error message'), 1);
    const plugin = await PluginModel.findById('mockId');
    deepEqualEntity(plugin, { ...pluginData, id: 'mockId', status: 2, error: 'update error message' });
  });
  it('#should remove by id', async () => {
    assert.strictEqual(await PluginModel.removeById('mockId'), 1);
    assert.strictEqual(await PluginModel.findById('mockId'), undefined);
  });
  it('#should remove by id but id not found', async () => {
    assert.strictEqual(await PluginModel.removeById('mockId'), 0);
  });
});
