import ora from 'ora';
import { runJob, getJobById, getJobByPipeline, getJobs, getLogById } from '../service/job';

const PipelineStatus: any = {
  0: 'creating',
  1: 'running',
  2: 'success',
  3: 'fail'
};

const spinner = ora();

export const job = async (operation: string, id: string, pipelineId: string, verbose: string) => {
  let data: any;
  switch (operation) {
  case 'run':
    if (!pipelineId) {
      spinner.fail(`Please provide the pipeline id to run`);
      return;
    }
    data = await runJob(pipelineId);
    spinner.succeed(`create job ${data.id} succeeded`);
    if (verbose === 'true') {
      let logs = ' ';
      const timer = setInterval(async () => {
        try {
          const jobInfo = await getJobById(data.id);
          if (jobInfo.status === 2 || jobInfo.status === 3) {
            clearInterval(timer);
          } else {
            const log = await getLogById(data.id);
            const incrementLog = log.substring(log.indexOf(logs) + 1);
            logs = log;
            console.log(incrementLog);
          }
        } catch (err) {
          spinner.fail(err.message);
          clearInterval(timer);
        }
      }, 2000);
    }
    break;
  case 'list':
    if (id) {
      data = await getJobById(id);
      console.log(JSON.stringify(data, null, 2));
    } else if (pipelineId) {
      data = await getJobByPipeline(pipelineId);
      data = data.rows.map((row: any) => ({
        id: row.id,
        pipelineId: row.pipelineId,
        status: PipelineStatus[row.status],
        createdAt: row.createdAt
      }));
      console.table(data);
    } else {
      data = await getJobs();
      data = data.rows.map((row: any) => ({
        id: row.id,
        pipelineId: row.pipelineId,
        status: PipelineStatus[row.status],
        createdAt: row.createdAt
      }));
      console.table(data);
    }
    break;
  case 'log':
    if (id) {
      data = await getLogById(id);
      console.log(data);
    } else {
      spinner.fail('Please provide job id');
    }
  }
};
