import { createStubInstance, StubbedInstanceWithSinonAccessor } from '@loopback/testlab';
import test from 'ava';
import { LogController } from '../../../controllers';
import { JobService } from '../../../services';

function initJobController(): {
  jobService: StubbedInstanceWithSinonAccessor<JobService>,
  logController: LogController
  } {
  const jobService = createStubInstance<JobService>(JobService);
  const logController = new LogController(jobService);
  return {
    jobService,
    logController
  };
}

test('list version info', async (t) => {
  const { logController, jobService } = initJobController();
  const mockLogs = [ 'log-stdout', 'log-stderr' ];
  jobService.stubs.getLogById.resolves(mockLogs);
  const logs = await logController.view('mockId');
  t.deepEqual(logs, mockLogs, 'logs not current');
});
