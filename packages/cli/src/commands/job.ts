import ora from 'ora';
import { runJob, getJobById, getJobByPipeline, getJobs, getLogById } from '../service/job';
import { ResponseParams } from '../request';
import { JobOperation } from '../types/config';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

const spinner = ora();

function getListJob(data: ResponseParams) {
  data = data.rows.map((row: Record<'id' | 'pipelineId' | 'status' | 'createdAt', any>) => ({
    id: row.id,
    pipelineId: row.pipelineId,
    status: PipelineStatus[row.status],
    createdAt: row.createdAt
  }));
  return data;
}

export function fetchLog(data: ResponseParams, logs: string) {
  setTimeout(async () => {
    try {
      const jobInfo = await getJobById(data.id);
      if (!(jobInfo.status === 2 || jobInfo.status === 3)) {
        let log = await getLogById(data.id);
        log = log.log;
        let incrementLog;
        if (logs) {
          incrementLog = log.substring(log.indexOf(logs) + 1);
        } else {
          incrementLog = log;
        }    
        console.log(incrementLog);
        fetchLog(data, logs);
      }
    } catch (err) {
      spinner.fail(err.message);
    }
  }, 2000);
}

export const job = async (operation: JobOperation, id: string, pipelineId: string, verbose: boolean) => {
  let data: ResponseParams;
  switch (operation) {
  case 'run':
    if (!pipelineId) {
      spinner.fail(`Please provide the pipeline id to run`);
      return;
    }
    data = await runJob(pipelineId);
    spinner.succeed(`create job ${data.id} succeeded`);
    if (verbose === true) {
      fetchLog(data, '');
    }
    break;
  case 'list':
    if (id) {
      data = await getJobById(id);
      console.log(JSON.stringify(data, null, 2));
    } else if (pipelineId) {
      data = await getJobByPipeline(pipelineId);
      data = getListJob(data);
      console.table(data);
    } else {
      data = await getJobs();
      data = data.rows.map((row: Record<'id' | 'pipelineId' | 'status' | 'createdAt', any>) => ({
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
