import { get, post } from '../request';
import { route } from '../router';

export const runJob = (pipelineId: string) => post(route.job, {
  pipelineId
});


export const getJobById = (id: string) => get(`${route.job}/${id}`);

export const getJobByPipeline = (pipelineId: string) => get(route.job, {
  pipelineId
});

export const getJobs = () => get(route.job);

export const getLogById = (id: string) => get(`${route.job}/${id}/log`);

export const startJob = (path: string) => post(`${route.job}/start`, {
  config: path
});
