import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import { app, assert } from 'midway-mock/bootstrap';
import DB from '../../src/boot/database';
import { PipelineModel } from '../../src/model/pipeline';
import { pipelineData, anotherPipelineData, deepEqualEntity } from './helper';

describe('test the pipeline model', () => {
  before(async () => {
    const db = await app.applicationContext.getAsync<DB>('pipcookDB');
    await db.connect();
    await PipelineModel.destroy({ truncate: true });
  });
  after(async () => {
    await PipelineModel.destroy({ truncate: true });
  });
  afterEach(() => {
    sinon.restore();
  });
  it('#should create by params with id', async () => {
    const pipeline = await PipelineModel.createPipeline({ ...pipelineData, id: 'mockId' });
    deepEqualEntity(pipeline, { ...pipelineData, id: 'mockId' });
  });
  it('#should create by params without id', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('anotherMockId');
    const pipeline = await PipelineModel.createPipeline(anotherPipelineData);
    deepEqualEntity(pipeline, { ...anotherPipelineData, id: 'anotherMockId' });
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should get by id', async () => {
    const pipeline = await PipelineModel.getPipeline('mockId');
    deepEqualEntity(pipeline, { ...pipelineData, id: 'mockId' });
  });
  it('#should get by name', async () => {
    const pipeline = await PipelineModel.getPipeline('anotherName');
    deepEqualEntity(pipeline, { ...anotherPipelineData, id: 'anotherMockId', name: 'anotherName' });
  });
  it('#should query pipelines by parameters', async () => {
    const pipelines = await PipelineModel.queryPipelines({ limit: 1, offset: 0 });
    assert.equal(pipelines.length, 1, 'next pipeline length check');
    deepEqualEntity(pipelines[0], { ...anotherPipelineData, id: 'anotherMockId', jobs: [] }, 'pipelines offset 0 check');
    const nextPage = await PipelineModel.queryPipelines({ limit: 5, offset: 1 });
    assert.equal(nextPage.length, 1, 'pipeline length check');
    deepEqualEntity(nextPage[0], { ...pipelineData, id: 'mockId', jobs: [] }, 'pipelines offset 1 check');
  });
  it('#should update pipeline', async () => {
    let modified = { ...pipelineData };
    for (let key in modified) {
      modified[key] = modified[key] + '_modify';
    }
    const pipeline = await PipelineModel.updatePipelineById('mockId', modified);
    deepEqualEntity(pipeline, { ...modified, id: 'mockId' });
  });
  it('#should update an nonexistent pipeline', async () => {
    const pipeline = await PipelineModel.updatePipelineById('nonexistent-mockId', {});
    assert.equal(pipeline, undefined, 'nonexistent pipeline check');
  });
  it('#should remove pipeline by id', async () => {
    assert.equal(await PipelineModel.removePipelineById('mockId'), 1);
  });
  it('#should clear all the pipelines', async () => {
    assert.equal(await PipelineModel.removePipelines(), 1);
  });
});
