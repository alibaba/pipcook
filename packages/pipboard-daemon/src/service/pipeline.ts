import { provide, inject } from 'midway';
import { PipelineDB, createRun } from '@pipcook/pipcook-core';
import * as path from 'path';
import { fork } from 'child_process';

@provide('pipelineService')
export class PipelineService {

  @inject('pipelineModel')
  model;

  @inject('runModel')
  runModel;

  async initPipeline(config: PipelineDB) {
    const record = await this.model.create(config);
    return record;
  }

  async getPipelineById(id: string) {
    const record = await this.model.findOne({
      where: { id }
    });
    return record;
  }

  async getPipelines(offset: number, limit: number) {
    const records = await this.model.findAndCountAll({
      offset,
      limit
    });
    return records;
  }

  async deletePipelineById(id: string) {
    await this.model.destroy({
      where: { id }
    });
  }

  async updatePipelineById(id: string, config: PipelineDB) {
    await this.model.update(config, {
      where: { id }
    });
    const record = await this.getPipelineById(id);
    return record;
  }

  async createNewRun(pipelineId: string) {
    const config = await createRun(pipelineId);
    const record = await this.runModel.create(config);
    return record;
  }

  async startRun(runRecord: any) {
    const pipelineRecord = await this.getPipelineById(runRecord.pipelineId);
    const script = path.join(__dirname, '..', 'assets', 'runConfig.js');
    await new Promise((resolve, reject) => {
      const child = fork(script, [ runRecord.pipelineId, runRecord.id, JSON.stringify(pipelineRecord), 'run-pipeline' ], {
        silent: true,
        env: {
          NODE_PATH: '/Users/queyue/Documents/work/pipcook/test/node_modules'
        }
      });
      child.stdout.on('data', (data) => {
        console.log(String(data));
      });
      child.stderr.on('data', (data) => {
        console.error(String(data));
      });
      child.on('message', (data) => {
        if (data.type === 'pipeline-status') {
          console.log(data);
        }
      });
      child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code === 0) {
          resolve();
        } else {
          reject(code);
        }
      });
    });
  }
}
