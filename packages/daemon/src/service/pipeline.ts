import { provide, inject } from 'midway';
import { PipelineDB, createRun, writeOutput, getLog } from '@pipcook/pipcook-core';
import * as path from 'path';
import { MODULE_PATH } from '../utils/tools';
import { fork } from 'child_process';

import { RunParams } from '../interface';

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
      limit,
      order: [['createdAt', 'DESC']]
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

  async getRunById(id: string) {
    const record = await this.runModel.findOne({
      where: { id }
    });
    return record;
  }

  async getRunsByPipelineId(pipelineId: string, offset: number, limit: number) {
    const records = await this.runModel.findAndCountAll({
      offset,
      limit,
      where: {
        pipelineId
      },
      order: [['createdAt', 'DESC']]
    });
    return records;
  }

  async getRuns(offset: number, limit: number) {
    const records = await this.runModel.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return records;
  }

  async updateRunById(id: string, data: RunParams) {
    await this.runModel.update(data, {
      where: { id }
    });
    const record = await this.getRunById(id);
    return record;
  }

  async startRun(runRecord: any) {
    const pipelineRecord = await this.getPipelineById(runRecord.pipelineId);
    const script = path.join(__dirname, '..', 'assets', 'runConfig.js');
    await new Promise((resolve, reject) => {
      const child = fork(script, [ runRecord.pipelineId, runRecord.id, JSON.stringify(pipelineRecord), 'run-pipeline' ], {
        silent: true,
        env: {
          NODE_PATH: MODULE_PATH
        }
      });
      child.stdout.on('data', async (data) => {
        await writeOutput(runRecord.id, data);
      });
      child.stderr.on('data', async (data) => {
        await writeOutput(runRecord.id, data);
        await writeOutput(runRecord.id, data, true);
      });
      child.on('message', async (data) => {
        if (data.type === 'pipeline-status') {
          await this.updateRunById(runRecord.id, data.data);
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

  async getLogById(id: string) {
    const logs = await getLog(id);
    return logs;
  }
}
