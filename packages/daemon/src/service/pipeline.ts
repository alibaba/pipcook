import { provide, inject } from 'midway';
import { PipelineDB, constants } from '@pipcook/pipcook-core';
import * as path from 'path';
import { fork } from 'child_process';
import * as validate from 'uuid-validate';
import * as fs from 'fs-extra';

import { MODULE_PATH } from '../utils/tools';
import { RunParams } from '../interface';
import { createRun, writeOutput, retriveLog } from '../runner/helper';

const { PIPCOOK_LOGS } = constants;

function getIdOrName(id: string) {
  if (!id) {
    throw new Error('id or name cannot be empty');
  }
  const isValidateUuid = validate(id);
  const fetchParam = isValidateUuid ? {
    id
  } : {
    name: id
  };
  return fetchParam;
}

@provide('pipelineService')
export class PipelineService {

  @inject('pipelineModel')
  model;

  @inject('runModel')
  runModel;

  initPipeline(config: PipelineDB) {
    return this.model.create(config);
  }

  async getPipelineById(id: string) {
    const record = await this.model.findOne({
      where: getIdOrName(id)
    });
    return record;
  }

  async getPipelines(offset: number, limit: number) {
    const records = await this.model.findAndCountAll({
      offset,
      limit,
      order: [ [ 'createdAt', 'DESC' ] ]
    });
    return records;
  }

  async deletePipelineById(id: string) {
    await this.model.destroy({
      where: getIdOrName(id)
    });
  }

  async updatePipelineById(id: string, config: PipelineDB) {
    await this.model.update(config, {
      where: getIdOrName(id)
    });
    const record = await this.getPipelineById(id);
    return record;
  }

  async createNewRun(pipelineId: string) {
    pipelineId = await this.getPipelineId(pipelineId);
    const config = await createRun(pipelineId);
    const record = await this.runModel.create(config);
    await fs.ensureFile(path.join(PIPCOOK_LOGS, record.id, 'stderr'));
    await fs.ensureFile(path.join(PIPCOOK_LOGS, record.id, 'stdout'));
    return record;
  }

  async getRunById(id: string) {
    const record = await this.runModel.findOne({
      where: { id }
    });
    return record;
  }

  async getRunsByPipelineId(pipelineId: string, offset: number, limit: number) {
    pipelineId = await this.getPipelineId(pipelineId);
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

  async getJobs(offset: number, limit: number) {
    const records = await this.jobModel.findAndCountAll({
      offset,
      limit,
      order: [ [ 'createdAt', 'DESC' ] ]
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
    const script = path.join(__dirname, '..', '..', 'assets', 'runConfig.js');
    await new Promise((resolve, reject) => {
      const child = fork(script, [ runRecord.pipelineId, runRecord.id, JSON.stringify(pipelineRecord), 'run-pipeline' ], {
        silent: true,
        cwd: path.join(process.cwd(), '..', '..'),
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
      child.on('message', async (data: any) => {
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
    const logs = await retriveLog(id);
    return logs;
  }

  async getPipelineId(id: string) {
    if (!id) {
      throw new Error('id or name cannot be empty');
    }
    const isValidateUuid = validate(id);
    if (isValidateUuid) {
      return id;
    } else {
      const pipelineInfo = await this.getPipelineById(id);
      return pipelineInfo.id;
    }
  }
}
