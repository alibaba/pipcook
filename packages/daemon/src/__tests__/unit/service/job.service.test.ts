import {
  sinon,
  createStubInstance,
  StubbedInstanceWithSinonAccessor
} from '@loopback/testlab';
import test from 'ava';
import { PluginRepository, JobRepository } from '../../../repositories';
import * as fs from 'fs-extra';
import * as ChileProcess from 'child_process';
import * as core from '@pipcook/pipcook-core';
import { PluginPackage } from '@pipcook/costa';
import * as path from 'path';
import { JobService, PluginService } from '../../../services';
import { Tracer } from '../../../services';
import { Job, Pipeline } from '../../../models';
// import * as JobRunner from '../../../job-runner';
import { mockFunctionFromGetter } from '../../__helpers__';
import * as tvmGen from '../../../generator/tvm';
import * as nodeGen from '../../../generator/nodejs';
import * as os from 'os';

function initJobService(): {
  pluginRepository: StubbedInstanceWithSinonAccessor<PluginRepository>,
  pluginService: StubbedInstanceWithSinonAccessor<PluginService>,
  jobRepository: StubbedInstanceWithSinonAccessor<JobRepository>,
  jobService: JobService
  } {
  const pluginRepository = createStubInstance<PluginRepository>(PluginRepository);
  const pluginService = createStubInstance<PluginService>(PluginService);
  const jobRepository = createStubInstance<JobRepository>(JobRepository);
  const jobService = new JobService(pluginService, jobRepository, pluginRepository);
  return {
    pluginRepository,
    pluginService,
    jobRepository,
    jobService
  };
}

// test the job service
test.serial.afterEach(() => {
  sinon.restore();
});
test.serial('create job', async (t) => {
  const { jobRepository, jobService } = initJobService();
  const mockObj = { id: 'mockId' };
  const mockReadJSON = sinon.stub(fs, 'readJSON').resolves({ version: '1.1.0' });
  jobRepository.stubs.create.resolves(mockObj as any);
  t.deepEqual(await jobService.createJob('mockId'), mockObj);
  t.deepEqual(jobRepository.stubs.create.args, [ [ {
    pipelineId: 'mockId',
    specVersion: '1.1.0',
    status: core.PipelineStatus.INIT,
    params: [],
    currentIndex: -1
  } ] ]);
  t.true(mockReadJSON.calledOnce);
});

test.serial('remove job by id', async (t) => {
  const { jobRepository, jobService } = initJobService();
  const mockJob = createStubInstance<Job>(Job);
  mockJob.stubs.id = 'mockJobId';
  const mockGetJobById = jobRepository.stubs.findById.resolves(mockJob);
  const mockRemoveJobById = jobRepository.stubs.deleteById.resolves();
  const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
  await t.notThrowsAsync(jobService.removeJobById('mockJobId'), 'check result');
  t.true(mockGetJobById.calledOnceWithExactly('mockJobId'), 'check mockGetJobById');
  t.true(mockRemoveJobById.calledOnceWithExactly('mockJobId'), 'check mockRemoveJobById');
  console.log(`${core.constants.PIPCOOK_RUN}/mockJobId`);
  t.true(mockFsRemove.calledOnceWith(`${core.constants.PIPCOOK_RUN}/mockJobId`), 'check mockFsRemove');
});
test.serial('remove job but id not found', async (t) => {
  const { jobRepository, jobService } = initJobService();
  const mockGetJobById = jobRepository.stubs.findById.rejects(new Error('mock error'));
  await t.throwsAsync(jobService.removeJobById('mockJobId'), { instanceOf: Error, message: 'mock error' }, 'check result');
  t.true(mockGetJobById.calledOnceWithExactly('mockJobId'), 'check mockGetJobById');
});

test.serial('remove job by models', async (t) => {
  const { jobRepository, jobService } = initJobService();
  const mockJobs = [
    {
      id: 'jobId1'
    },
    {
      id: 'jobId2'
    }
  ];
  const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
  jobRepository.stubs.deleteAll.resolves({ count : 2 });
  t.is(await jobService.removeJobByEntities(mockJobs as Job[]), 2, 'check result');
  t.true(jobRepository.stubs.deleteAll.calledOnceWithExactly({
    id: {
      inq: [ 'jobId1', 'jobId2' ]
    }
  }), 'check deleteAll');
  t.true(mockFsRemove.calledTwice, 'check mockFsRemove');
});

test.serial('generate output', async (t) => {
  const { jobService } = initJobService();
  ChileProcess.exec;
  sinon.replace(ChileProcess, 'exec',
    (cmd: string, opts: any, cb?: (error: ChileProcess.ExecException | null, stdout: string, stderr: string) => void) => {
      t.is(cmd, 'npm init -y', 'exec command check');
      t.deepEqual(opts, { cwd: '/home/output' }, 'exec option check');
      if (cb) {
        cb(null, '', '');
      }
    });
  const mockFsRemove = sinon.stub(fs, 'remove').resolves(true);
  const mockFsEnsureDir = sinon.stub(fs, 'ensureDir').resolves(true);
  const mockFsReadJson = sinon.stub(fs, 'readJSON').resolves({});
  const mockFsCopy = sinon.stub(fs, 'copy').resolves(true);
  const mockFsCompressTarFile = mockFunctionFromGetter(core, 'compressTarFile').resolves();
  const mockPlatform = sinon.stub(os, 'platform').returns('darwin');
  const mockTVMGenerator = sinon.stub(tvmGen, 'generateTVM').resolves();
  const mockNodeGenerator = sinon.stub(nodeGen, 'generateNode').resolves();

  await jobService.generateOutput({ id: 'mockId' } as Job, {
    modelPath: 'mockPath',
    plugins: {
      modelDefine: { name: 'modelPlugin', version: 'mockVersion' } as PluginPackage,
      dataProcess: {
        version: 'mockVersion',
        name: 'dataProcess'
      } as PluginPackage
    },
    pipeline: {} as Pipeline,
    workingDir: '/home',
    template: 'mock template'
  });
  t.true(mockFsRemove.calledOnceWith('/home/output'), 'check mockFsRemove');
  t.true(mockFsEnsureDir.calledOnceWith('/home/output'), 'check mockFsEnsureDir');
  t.true(mockFsReadJson.called, 'check mockFsReadJson');
  t.true(mockFsCopy.called, 'check mockFsCopy');
  t.true(mockTVMGenerator.called, 'check TVMGenerator');
  t.true(mockNodeGenerator.called, 'check NodeGenerator');
  t.true(mockPlatform.called, 'check platform');
  t.true(mockFsCompressTarFile.calledOnceWith('/home/output', '/home/output.tar.gz'), 'check mockFsCompressTarFile');
});

test('should get output tar by job id', async (t) => {
  const { jobService } = initJobService();
  t.is(jobService.getOutputTarByJobId('mockId'), path.join(core.constants.PIPCOOK_RUN, 'mockId', 'output.tar.gz'));
});

test.serial('should get log by job id', async (t) => {
  const { jobService } = initJobService();
  const mockFsPathExists = sinon.stub(fs, 'pathExists').resolves(true);
  const mockFsReadFile = sinon.stub(fs, 'readFile').resolves('test' as any);
  t.deepEqual(await jobService.getLogById('mockId'), [ 'test', 'test' ]);
  t.true(mockFsPathExists.called, 'mockFsPathExists check');
  t.true(mockFsReadFile.called, 'mockFsReadFile check');
});
test.serial('get log by job id but log not exists', async (t) => {
  const { jobService } = initJobService();
  const mockFsPathExists = sinon.stub(fs, 'pathExists').resolves(false);
  let catched = false;
  try {
    await jobService.getLogById('mockId');
  } catch (err) {
    catched = true;
    t.is(err.statusCode, 404);
  }
  t.true(mockFsPathExists.called, 'mockFsPathExists check');
  t.true(catched, 'error check');
});

test.serial('should run job', async (t) => {
  const { jobService, jobRepository } = initJobService();
  const mockStartJob = sinon.stub(jobService, 'startJob').resolves();
  jobRepository.stubs.updateById.resolves();
  let cbCount1 = 0, cbCount2 = 0;
  const futures = [];

  futures.push(jobService.runJob(
    { id: 'mockId' } as Job,
    { id: 'mockPipelineId' } as Pipeline,
    { dataAccess: { plugin: {} as PluginPackage, params: {} } },
    {
      // if assert failed, it will make test timeout, because it's event listener
      dispatch: (event) => {
        t.is(event.type, 'job_status');
        if (cbCount1 === 0) {
          t.deepEqual(event.data, {
            jobStatus: 1,
            queueLength: undefined,
            step: undefined,
            stepAction: undefined
          });
        } else if (cbCount1 === 1) {
          t.deepEqual(event.data, {
            jobStatus: 4,
            queueLength: undefined,
            step: undefined,
            stepAction: undefined
          });
        }
        cbCount1++;
      },
      getLogger: () => {
        return {};
      }
    } as Tracer
  ));

  futures.push(jobService.runJob(
    { id: 'mockId' } as Job,
    { id: 'mockPipelineId' } as Pipeline,
    { dataAccess: { plugin: {} as PluginPackage, params: {} } },
    {
      // if assert failed, it will make test timeout, because it's event listener
      dispatch: (event) => {
        t.is(event.type, 'job_status');
        if (cbCount2 === 0) {
          t.deepEqual(event.data, {
            jobStatus: 5,
            queueLength: 1,
            step: undefined,
            stepAction: undefined
          });
        } else if (cbCount2 === 1) {
          t.deepEqual(event.data, {
            jobStatus: 5,
            queueLength: 0,
            step: undefined,
            stepAction: undefined
          });
        } else if (cbCount2 === 2) {
          t.deepEqual(event.data, {
            jobStatus: 4,
            queueLength: undefined,
            step: undefined,
            stepAction: undefined
          });
        }
        cbCount2++;
      },
      getLogger: () => {
        return {};
      }
    } as Tracer
  ));

  await Promise.all(futures);
  t.true(jobRepository.stubs.updateById.calledWith('mockId', { id: 'mockId', status: 5 /* pending */ }), 'mockSaveJob check');
  t.true(mockStartJob.calledTwice, 'mockStartJob check');
});

test.serial('run job with error', async (t) => {
  const { jobService, jobRepository } = initJobService();
  const mockUpdateById = jobRepository.stubs.updateById.resolves();
  const mockStartJob = sinon.stub(jobService, 'startJob').rejects(new Error('mock error'));
  await t.throwsAsync(jobService.runJob(
    { id: 'mockId' } as Job,
    { id: 'mockPipelineId' } as Pipeline,
    { dataAccess: { plugin: {} as PluginPackage, params: {} } },
    {
      getLogger: () => {
        return {};
      }
    } as Tracer
  ), { instanceOf: Error, message: 'mock error' }, 'runJob check');
  t.true(mockUpdateById.calledWith('mockId', { id: 'mockId', status: 5 /* pending */ } as Job), 'mockUpdateById check');
  t.true(mockStartJob.calledOnce, 'mockStartJob check');
});

test('should stop job', async (t) => {
  const { jobService, jobRepository } = initJobService();
  const mockGetJobById = jobRepository.stubs.findById.resolves({ id: 'mockId', status: 1 /* running */ } as any);
  const mockUpdateById = jobRepository.stubs.updateById.resolves();
  sinon.replace(jobService, 'runnableMap', { mockId: { destroy: sinon.stub() } } as any);

  await jobService.stopJob('mockId');

  t.true(mockUpdateById.calledOnceWith('mockId', { id: 'mockId', status: 4 /* canceled */ } as Job), 'mockSaveJob check');
  t.true(mockGetJobById.calledOnceWith('mockId'), 'mockGetJobById check');
});

test('stop invalid job', async (t) => {
  const { jobService, jobRepository } = initJobService();
  const mockFindById = jobRepository.stubs.findById.resolves({ id: 'mockId', status: 4 /* canceled */ } as any);
  await t.throwsAsync(jobService.stopJob('mockId'), { name: 'BadRequestError', message: 'job is not running' });
  t.true(mockFindById.calledOnceWith('mockId'), 'mockFindById check');
});

test('should stop job without runnable', async (t) => {
  const { jobService, jobRepository } = initJobService();
  const mockFindById = jobRepository.stubs.findById.resolves({ id: 'mockId', status: 1 /* running */ } as any);
  const mockUpdateById = jobRepository.stubs.updateById.resolves();
  await jobService.stopJob('mockId');
  t.true(mockUpdateById.calledOnceWith('mockId', { id: 'mockId', status: 4 /* canceled */ } as Job), 'mockSaveJob check');
  t.true(mockFindById.calledOnceWith('mockId'), 'mockFindById check');
});

test.todo('start job and finish');

test.todo('start job but error thrown');
