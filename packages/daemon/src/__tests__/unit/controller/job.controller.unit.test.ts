
import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance
} from '@loopback/testlab';
import { PipelineStatus } from '@pipcook/pipcook-core';
import test from 'ava';
import { JobController, JobCreateParameters } from '../../../controllers';
import { Job, JobParam, Pipeline } from '../../../models';
import { JobRepository } from '../../../repositories';
import { JobService, PipelineService, Tracer, TraceService } from '../../../services';


function initJobController(): {
  jobService: StubbedInstanceWithSinonAccessor<JobService>,
  traceService: StubbedInstanceWithSinonAccessor<TraceService>,
  pipelineService: StubbedInstanceWithSinonAccessor<PipelineService>,
  jobRepository: StubbedInstanceWithSinonAccessor<JobRepository>,
  jobController: JobController
  } {
  const jobRepository = createStubInstance<JobRepository>(JobRepository);
  const jobService = createStubInstance<JobService>(JobService);
  const traceService = createStubInstance<TraceService>(TraceService);
  const pipelineService = createStubInstance<PipelineService>(PipelineService);
  const jobController = new JobController(jobRepository, traceService, pipelineService, jobService);
  return {
    jobService,
    traceService,
    pipelineService,
    jobRepository,
    jobController
  };
}

const id = '123';
const mockJobEntity = {
  id,
  status: PipelineStatus.SUCCESS
};
const mockJob = new Job(mockJobEntity);

test('find a job by id', async (t) => {
  const { jobController, jobRepository } = initJobController();

  jobRepository.stubs.findById.resolves(mockJob);

  const details = await jobController.get(id);

  t.deepEqual(details.toJSON(), mockJobEntity);
  t.true(jobRepository.stubs.findById.calledOnce);
});

test('find a log by id', async (t) => {
  const { jobController, jobRepository, jobService } = initJobController();
  const mockJobEntity = { id };
  const mockJob = new Job(mockJobEntity);

  jobRepository.stubs.findById.resolves(mockJob);
  jobService.stubs.getLogById.resolves([ id ]);

  const details = await jobController.viewLog(id);

  t.deepEqual(details, [ id ]);
  t.true(jobRepository.stubs.findById.calledOnce);
  t.true(jobService.stubs.getLogById.calledOnce);
});

test('stop a job by id', async (t) => {
  const { jobController, jobRepository } = initJobController();
  const params: JobParam[] = [];
  const mockJobEntity = { id, params };
  const mockJob = new Job(mockJobEntity);

  jobRepository.stubs.findById.resolves(mockJob);

  const details = await jobController.getParams(id);

  t.deepEqual(details, params);
  t.true(jobRepository.stubs.findById.calledOnce);
});

test('cancel a job by id', async (t) => {
  const { jobController, jobService } = initJobController();

  jobService.stubs.stopJob.resolves();

  await jobController.stop(id);

  t.true(jobService.stubs.stopJob.calledOnce);
});

test('delete a job by id', async (t) => {
  const { jobController, jobService } = initJobController();

  jobService.stubs.removeJobById.resolves();

  await jobController.deleteById(id);

  t.true(jobService.stubs.removeJobById.calledOnce);
});

test('delete all jobs', async (t) => {
  const { jobRepository, jobController } = initJobController();

  jobRepository.stubs.deleteAll.resolves();

  await jobController.deleteAll();

  t.true(jobRepository.stubs.deleteAll.calledOnce);
});

test('list all jobs', async (t) => {
  const { jobRepository, jobController } = initJobController();

  jobRepository.stubs.find.resolves([]);

  const jobs = await jobController.list();

  t.deepEqual(jobs, []);
  t.true(jobRepository.stubs.find.calledOnce);
});

test('start a job', async (t) => {
  const { jobController, pipelineService, jobService, traceService } = initJobController();

  const param = new JobCreateParameters();
  param.pipelineId = '1';
  param.params = [];


  const mockPipelineEntity = {
    name: 'mock',
    dataCollectId: '1',
    dataCollect: 'dataCollect',
    dataCollectParams: {},
    dataAccessId: '2',
    dataAccess: 'dataAccessId',
    dataAccessParams: {},
    dataProcessId: '3',
    dataProcess: 'dataProcess',
    dataProcessParams: {},
    datasetProcessId: '4',
    datasetProcess: 'datasetProcess',
    datasetProcessParams: {},
    modelDefineId: '5',
    modelDefine: 'modelDefine',
    modelDefineParams: {},
    modelTrainId: '6',
    modelTrain: 'modelTrain',
    modelTrainParams: {},
    modelEvaluateId: '7',
    modelEvaluate: 'modelEvaluate',
    modelEvaluateParams: {},
    modelLoadId: '8',
    modelLoad: 'modelLoad',
    modelLoadParams: {}
  };
  const mockPipeline = new Pipeline(mockPipelineEntity);

  const tracer = new Tracer();

  pipelineService.stubs.getPipelineByIdOrName.resolves(mockPipeline);
  traceService.stubs.create.resolves(tracer);
  jobService.stubs.createJob.resolves(mockJob);
  jobService.stubs.runJob.resolves({});
  traceService.stubs.destroy.resolves({});

  const resp = await jobController.create(param);
  const expected = {
    ... mockJob,
    traceId: tracer.id
  };
  t.deepEqual(resp, expected);
  t.true(pipelineService.stubs.getPipelineByIdOrName.calledOnce);
  t.true(traceService.stubs.create.calledOnce);
  t.true(jobService.stubs.createJob.calledOnce);
  // TODO the two do not work right now
  // t.true(jobService.stubs.runJob.calledOnce);
  // t.true(traceService.stubs.destroy.calledOnce);
});

//TODO: write download

// test('get output by id', async t => {
//   const sandbox = new TestSandbox('./');

//   const { jobController, jobRepository, jobService } = initJobController();

//   const mockPath = `${__dirname}/mockPath`;

//   await sandbox.writeTextFile(mockPath, 'mockFile');

//   jobRepository.stubs.findById.resolves(mockJob);
//   jobService.stubs.getOutputTarByJobId.resolves(mockPath);

//   jobController.download(id, response);

//   await sandbox.delete();

//   t.true(jobRepository.stubs.findById.called)
// });
