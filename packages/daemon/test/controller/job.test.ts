import { app, assert, mm } from 'midway-mock/bootstrap';
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
    mm.restore();
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

  it('should get job info', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'id');
      return mockJob;
    });
    return app
      .httpRequest()
      .get('/api/job/id')
      .expect('Content-Type', /json/)
      .expect((resp) => {
        assert.equal(resp.body.id, mockJob.id);
      })
      .expect(200);
  });

  it('get nonexistent job info', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'id');
      return undefined;
    });
    return app
      .httpRequest()
      .get('/api/job/id')
      .expect(404);
  });

  it('should trace event', () => {
    app.mockClassFunction('traceManager', 'get', (id): any => {
      assert.equal(id, 'trace-id');
      let callback;
      return {
        listen: (cb) => {
          callback = cb;
        },
        wait: async () => {
          return callback({ type: 'mock type', data: 'mock data' });
        }
      }
    });
    return app
      .httpRequest()
      .get('/api/job/event/trace-id')
      .expect(200).expect((res) => {
        console.log('trace res', res.text);
        assert.ok((res.text as string).indexOf('mock type') >= 0);
        assert.ok((res.text as string).indexOf('mock data') >= 0);
      });
  });

  it('should delete job by id', () => {
    app.mockClassFunction('pipelineService', 'removeJobById', async (id: string) => {
      assert.equal(id, 'id');
      return 1;
    });
    return app
      .httpRequest()
      .del('/api/job/id')
      .expect(204);
  });

  it('should delete all jobs', () => {
    let called = false;
    app.mockClassFunction('pipelineService', 'removeJobs', () => {
      called = true;
    });
    return app
      .httpRequest()
      .del('/api/job')
      .expect(204).expect(() => {
        assert.ok(called);
      });
  });

  it('delete nonexistent job', () => {
    app.mockClassFunction('pipelineService', 'removeJobById', async (id: string) => {
      assert.equal(id, 'id');
      return 0;
    });
    return app
      .httpRequest()
      .del('/api/job/id')
      .expect(404);
  });

  it('should cancel job by id', () => {
    app.mockClassFunction('pipelineService', 'stopJob', async (id: string) => {
      assert.equal(id, 'id');
    });
    return app
      .httpRequest()
      .post('/api/job/id/cancel')
      .expect(204);
  });

  it('should get job log by id', () => {
    const logs = [
      '1', 
      '2'
    ];
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'id');
      return {
        id: 'id'
      }
    });
    app.mockClassFunction('pipelineService', 'getLogById', async (id: string) => {
      assert.equal(id, 'id');
      return logs;
    });
    return app
      .httpRequest()
      .get('/api/job/id/log')
      .expect(200).expect((res) => {
        assert.deepEqual(res.body, logs);
      });
  });

  it('get nonexistent job log by id', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'id');
      return undefined;
    });
    return app
      .httpRequest()
      .get('/api/job/id/log')
      .expect(404);
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
    app.mockClassFunction('traceManager', 'destroy', async (id, err): Promise<any> => {
      assert.equal(err, undefined);
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
  it('should run a job with error', () => {
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
    const error = new TypeError('mock error');
    app.mockClassFunction('traceManager', 'create', async (): Promise<any> => {
      return {
        id: 'traceId'
      };
    });
    app.mockClassFunction('traceManager', 'destroy', async (id, err): Promise<any> => {
      assert.equal(id, 'traceId');
      assert.equal(err, error);
    });
    app.mockClassFunction('pipelineService', 'runJob', async (job: any, pipeline: any, plugins: any[], log: any): Promise<any> => {
      assert.deepEqual(job, mockJob);
      assert.deepEqual(pipeline, mockPipeline);
      assert.deepEqual(plugins, mockPlugins);
      throw error;
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
  it('should run a job but pipeline not exists', () => {
    app.mockClassFunction('pipelineService', 'getPipeline', async (id: string): Promise<any> => {
      assert.equal(id, 'id');
      return undefined;
    });
    return app
      .httpRequest()
      .post('/api/job')
      .send({ pipelineId: 'id' })
      .expect(404);
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
  it('download a job but file not exists', () => {
    app.mockClassFunction('pipelineService', 'getJobById', async (id: string) => {
      assert.equal(id, 'job-id');
      return { status: PipelineStatus.SUCCESS };
    });
    app.mockClassFunction('pipelineService', 'getOutputTarByJobId', (id: string) => {
      assert.equal(id, 'job-id');
      return 'not-exist';
    });
    return app
      .httpRequest()
      .get('/api/job/job-id/output')
      .expect('Content-Type', /json/)
      .expect(async (resp) => {
        assert.equal(resp.body.message, 'output file not found');
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
