import ora from 'ora';
import * as path from 'path';
import { getPipelines, createPipeline, updatePipeline, deletePipeline, getPipelineInfo } from '../service/pipeline';

const spinner = ora();

export const pipeline = async (operation: string, pipeline: string, pipelineId: string) => {
  let data: any;
  switch (operation) {
    case 'list':
      if (!pipeline) {
        data = await getPipelines();
        data = data.rows.map((row: any) => {
          const rowPost = {
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          }
          return rowPost;
        });
        console.table(data);
      } else {
        data = await getPipelineInfo(pipeline);
        console.log(JSON.stringify(data, null, 2));
      }
      break;
    case 'create':
      if (!pipeline) {
        spinner.fail('Please provide a path to your pipeline config');
        return;
      }
      data = await createPipeline(path.isAbsolute(pipeline) ? pipeline : path.join(process.cwd(), pipeline));
      spinner.succeed(`create pipeline ${data.id} succeeded`);
      break;
    case 'update':
      if (!(pipeline && pipelineId)) {
        spinner.fail('please provide both pipeline id and the path to config file');
        return;
      }
      data = await updatePipeline(pipeline, path.isAbsolute(pipelineId) ? pipelineId : path.join(process.cwd(), pipelineId));
      spinner.succeed(`update pipeline ${data.id} succeeded`);
      break;
    case 'delete':
      if (!pipeline) {
        spinner.fail('Please provide valid pipeline id');
        return;
      }
      data = await deletePipeline(pipeline);
      spinner.succeed(`delete pipeline ${pipeline} succeeded`);
      break;
  }
};
