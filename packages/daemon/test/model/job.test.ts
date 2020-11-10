import * as sinon from 'sinon';
import * as core from '@pipcook/pipcook-core';
import { app, assert } from 'midway-mock/bootstrap';
import DB from '../../src/boot/database';
import { JobModel } from '../../src/model/job';
import { PipelineModel } from '../../src/model/pipeline';
import { pipelineData, jobData, anotherJobData, anotherPipelineData, deepEqualEntity } from './helper';

const jobEntities = [];

describe('test the job model', () => {
  before(async () => {
    const db = await app.applicationContext.getAsync<DB>('pipcookDB');
    await db.connect();
    await JobModel.destroy({ truncate: true });
    await PipelineModel.destroy({ truncate: true });
  });
  after(async () => {
    await JobModel.destroy({ truncate: true });
    await PipelineModel.destroy({ truncate: true });
  });
  afterEach(() => {
    sinon.restore();
  });
  it('#should create by params with id', async () => {
    const mockGenerateId = sinon.stub(core, 'generateId').returns('mockJobId');
    await PipelineModel.create({ ...pipelineData, id: 'mockPipelineId' });
    const job = await JobModel.createJob('mockPipelineId', '1.0');
    assert.equal(job.id, 'mockJobId');
    assert.equal(job.specVersion, '1.0');
    assert.ok(mockGenerateId.calledOnce);
  });
  it('#should query with id', async () => {
    const job = await JobModel.getJobById('mockJobId');
    deepEqualEntity(job, { ...jobData, id: 'mockJobId' });
  });
  it('#should query with nonexistent id', async () => {
    const job = await JobModel.getJobById('nonexistentId');
    assert.equal(job, undefined);
  });
  it('#should save job', async () => {
    await JobModel.saveJob({ ...anotherJobData, id: 'mockJobId'});
    const job = await JobModel.getJobById('mockJobId');
    deepEqualEntity(job, { ...anotherJobData, id: 'mockJobId'});
  });
  it('#should create 4 random id jobs', async () => {
    await PipelineModel.create({ ...anotherPipelineData, id: 'mockAnotherPipelineId' });
    for (let i = 0; i < 4; ++i) {
      const job = await JobModel.createJob('mockAnotherPipelineId', '2.0');
      assert.equal(job.specVersion, '2.0');
      jobEntities.push(job);
    }
  });
  it('#should query all jobs', async () => {
    const jobs = await JobModel.queryJobs({});
    assert.equal(jobs.length, 5);
  });
  it('#should query job by pipeline id', async () => {
    const jobs = await JobModel.queryJobs({ pipelineId: 'mockAnotherPipelineId' });
    assert.equal(jobs.length, 4);
  });
  it('#should list job', async () => {
    const jobs = await JobModel.queryJobs({ pipelineId: 'mockAnotherPipelineId' }, { offset: 1, limit: 4 });
    assert.equal(jobs.length, 3);
  });
  it('#should remove job by id', async () => {
    const n = await JobModel.removeJobById('mockJobId');
    assert.equal(n, 1);
    assert.equal((await JobModel.queryJobs({})).length, 4);
  });
  it('#should remove job by nonexistent id', async () => {
    const n = await JobModel.removeJobById('nonexistent-id');
    assert.equal(n, 0);
    assert.equal((await JobModel.queryJobs({})).length, 4);
  });
  it('#should remove jobs by entities', async () => {
    const n = await JobModel.removeJobByEntities(jobEntities.slice(0, 1));
    assert.equal(n, 1);
    assert.equal((await JobModel.queryJobs({})).length, 3);
  });
  it('#should remove all jobs', async () => {
    const n = await JobModel.removeJobs();
    assert.equal(n, 3);
    assert.equal((await JobModel.queryJobs({})).length, 0);
  });
});
