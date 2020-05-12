import { get, post } from '../request';
import { route } from '../router';

export async function runJob(pipelineId: string) {
  const data = await post(route.job, {
    pipelineId
  });
  return data;
}

export async function getJobById(id: string) {
  const data = await get(`${route.job}/${id}`);
  return data;
}

export async function getJobByPipeline(pipelineId: string) {
  const data = await get(route.job, {
    pipelineId
  });
  return data;
}

export async function getJobs() {
  const data = await get(route.job);
  return data;
}

export async function getLogById(id: string) {
  const data = await get(`${route.job}/${id}/log`);
  return data;
}