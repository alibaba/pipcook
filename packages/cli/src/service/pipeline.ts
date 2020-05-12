import { get, post, put, remove } from '../request';
import { route } from '../router';

export async function getPipelines() {
  const data = await get(route.pipelines);
  return data;
}

export async function createPipeline(path: string) {
  const data = await post(route.pipelines, {
    config: path
  });
  return data;
}

export async function updatePipeline(pipelineId: string, path: string) {
  const data = await put(`${route.pipelines}/${pipelineId}`, {
    config: path
  });
  return data;
}

export async function getPipelineInfo(pipelineId: string) {
  const data = await get(`${route.pipelines}/${pipelineId}`);
  return data;
}

export async function deletePipeline(pipelineId: string) {
  await remove(`${route.pipelines}/${pipelineId}`);
}