import { app, assert } from 'midway-mock/bootstrap';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { join } from 'path';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
let mockPipeline = {
  id: '',
  name: 'pipeline-name',

  dataCollectId: 'dataCollectId',
  dataCollect: 'dataCollect',
  dataCollectParams: '{}',

  dataAccessId: 'dataAccessId',
  dataAccess: 'dataAccess',
  dataAccessParams: '{}',

  dataProcessId: 'dataProcessId',
  dataProcess: 'dataProcess',
  dataProcessParams: '{}',

  datasetProcessId: 'datasetProcessId',
  datasetProcess: 'datasetProcess',
  datasetProcessParams: '{}',

  modelDefineId: 'modelDefineId',
  modelDefine: 'modelDefine',
  modelDefineParams: '{}',

  modelLoadId: 'modelLoadId',
  modelLoad: 'modelLoad',
  modelLoadParams: '{}',

  modelTrainId: 'modelTrainId',
  modelTrain: 'modelTrain',
  modelTrainParams: '{}',

  modelEvaluateId: 'modelEvaluateId',
  modelEvaluate: 'modelEvaluate',
  modelEvaluateParams: '{}'
};
const mockJob = {
  id: 'jobId',
  toJSON: function () {
    return this;
  }
};
const mockPlugins = [ { id: '123' }, { id: '456' } ];

describe('test job controller', () => {
  beforeEach(function () {
    sandbox.restore();
});
  it('should list jobs', () => {
    return app
      .httpRequest()
      .get('/api/job')
      .expect('Content-Type', /json/)
      .expect((resp) => {
        assert.equal(Array.isArray(resp.body), true);
      })
      .expect(200);
  });

  it('should run a job', () => {
    app.mockClassFunction('pipelineService', 'getPipeline', async (id: string) => {
      assert.equal(id, 'id');
      mockPipeline = { ...mockPipeline, id };
      return mockPipeline;
    });
    app.mockClassFunction('pipelineService', 'fetchPlugins', async (pipeline: any): Promise<any[]> => {
      assert.deepEqual(pipeline, mockPipeline);
      return mockPlugins;
    });
    app.mockClassFunction('pipelineService', 'createJob', async (pipelineId: string): Promise<any> => {
      assert.equal(pipelineId, 'id');
      return mockJob;
    });
    app.mockClassFunction('pipelineService', 'runJob', async (job: any, pipeline: any, plugins: any[], log: any): Promise<any> => {
      assert.deepEqual(job, mockJob);
      assert.deepEqual(pipeline, mockPipeline);
      assert.deepEqual(plugins, mockPlugins);
    });
    return app
      .httpRequest()
      .post('/api/job')
      .send({ pipelineId: 'id' })
      .expect((resp) => {
        console.log(resp.body)
        assert.equal(resp.body.id, mockJob.id);
        assert.equal(typeof resp.body.traceId, 'string');
      })
      .expect(200);
  });
  it('should download job', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'job-id');
      return { status: PipelineStatus.SUCCESS };
    });
    app.mockClassFunction('pipelineService', 'getOutputTarByJobId', (id: string) => {
      assert.equal(id, 'job-id');
      return join(__dirname, 'job.test.ts');
    });
    const mockCreateReadStream = sandbox.stub(fs, 'createReadStream');
    return app
      .httpRequest()
      .get('/api/job/job-id/output')
      .expect('content-disposition', 'attachment; filename="pipcook-output-job-id.tar.gz"')
      .expect(async (resp) => {
        console.log(resp.header);
        sandbox.assert.calledOnceWithExactly(mockCreateReadStream, join(__dirname, 'job.test.ts'));
      })
      .expect(204);
  });
  it('download a invalid job', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'job-id');
      return { status: PipelineStatus.FAIL };
    });
    return app
      .httpRequest()
      .get('/api/job/job-id/output')
      .expect('Content-Type', /json/)
      .expect(async (resp) => {
        assert.equal(resp.body.message, 'invalid job status');
      })
      .expect(400);
  });
  it('should throw error run a uninstalled job', () => {
    app.mockClassFunction('pipelineService', 'getPipeline', async (id: string) => {
      assert.equal(id, 'id');
      mockPipeline = {...mockPipeline, id};
      return mockPipeline;
    });
    app.mockClassFunction('pipelineService', 'fetchPlugins', async (pipeline: any): Promise<any[]> => {
      assert.deepEqual(pipeline, mockPipeline);
      throw createHttpError(HttpStatus.NOT_FOUND, 'mock error');
    });
    app.mockClassFunction('pipelineService', 'createJob', async (pipelineId: string): Promise<any> => {
      assert.equal(pipelineId, 'id');
      return mockJob;
    });
    app.mockClassFunction('pipelineService', 'runJob', async (job: any, pipeline: any, plugins: any[], log: any): Promise<any> => {
      assert.deepEqual(job, mockJob);
      assert.deepEqual(pipeline, mockPipeline);
      assert.deepEqual(plugins, mockPlugins);
    });
    return app
      .httpRequest()
      .post('/api/job')
      .send({ pipelineId: 'id' })
      .expect((resp) => {
        console.log(resp.body)
        assert.equal(resp.body.message, 'mock error');
      })
      .expect(404);
  });
});
