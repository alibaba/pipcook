
import {
  StubbedInstanceWithSinonAccessor,
  createStubInstance
} from '@loopback/testlab';
import test from 'ava';
import { JobController } from '../../../controllers';
import { Job } from '../../../models';
import { JobRepository } from '../../../repositories';
import { JobService, PipelineService, TraceService } from '../../../services';

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

test('find an existing job', async (t) => {
  const { jobRepository, jobController } = initJobController();
  const mockJob = new Job({ id: 'mockId' });
  jobRepository.stubs.findById.resolves(mockJob);

  const details = await jobController.get('mockId');

  t.deepEqual(details, mockJob);
  t.true(jobRepository.stubs.findById.calledOnce);
});
