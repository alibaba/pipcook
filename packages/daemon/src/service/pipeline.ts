import { provide, inject } from 'midway';
import { PipelineDB, constants } from '@pipcook/pipcook-core';
import * as path from 'path';
import { fork } from 'child_process';
import * as validate from 'uuid-validate';
import * as fs from 'fs-extra';

import { MODULE_PATH } from '../utils/tools';
import { RunParams } from '../interface';
import { createRun, writeOutput, retriveLog } from '../runner/helper';
import { PipelineModel, PipelineModelStatic } from '../model/pipeline';
import { JobModelStatic, JobModel } from '../model/job';

const { PIPCOOK_LOGS } = constants;
type QueryParams = { id: string, name?: string } | { id?: string, name: string };

function getIdOrName(id: string): QueryParams {
  if (!id) {
    throw new Error('id or name cannot be empty');
  }
  return validate(id) as boolean ? { id } : { name: id };
}

@provide('pipelineService')
export class PipelineService {

  @inject('pipelineModel')
  model: PipelineModelStatic;

  @inject('jobModel')
  job: JobModelStatic;

  initPipeline(config: PipelineDB): Promise<PipelineModel> {
    return this.model.create(config);
  }

  async getPipelineById(id: string): Promise<PipelineModel> {
    return await this.model.findOne({
      where: getIdOrName(id)
    });
  }

  async getPipelines(offset: number, limit: number): Promise<{rows: PipelineModel[], count: number}> {
    return await this.model.findAndCountAll({
      offset,
      limit,
      order: [ [ 'createdAt', 'DESC' ] ]
    });
  }

  async deletePipelineById(id: string): Promise<void> {
    await this.model.destroy({
      where: getIdOrName(id)
    });
  }

  async updatePipelineById(id: string, config: PipelineDB): Promise<PipelineModel> {
    await this.model.update(config, {
      where: getIdOrName(id)
    });
    return await this.getPipelineById(id);
  }

  async createNewRun(pipelineId: string): Promise<JobModel> {
    pipelineId = await this.getPipelineId(pipelineId);
    const config = await createRun(pipelineId);
    const record = await this.job.create(config);
    await fs.ensureFile(path.join(PIPCOOK_LOGS, record.id, 'stderr'));
    await fs.ensureFile(path.join(PIPCOOK_LOGS, record.id, 'stdout'));
    return record;
  }

  async getJobById(id: string): Promise<JobModel> {
    return await this.job.findOne({
      where: { id }
    });
  }

  async getJobsByPipelineId(id: string, offset: number, limit: number): Promise<{rows: JobModel[], count: number}> {
    const pipelineId = await this.getPipelineId(id);
    return await this.job.findAndCountAll({
      offset,
      limit,
      where: {
        pipelineId
      },
      order: [
        ['createdAt', 'DESC']
      ]
    });
  }

  async getJobs(offset: number, limit: number): Promise<{rows: JobModel[], count: number}> {
    return await this.job.findAndCountAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    });
  }

  async updateRunById(id: string, data: RunParams): Promise<JobModel> {
    await this.job.update(data, {
      where: { id }
    });
    return this.getJobById(id);
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

  getLogById(id: string): Promise<string> {
    return retriveLog(id);
  }

  async getPipelineId(id: string): Promise<string> {
    if (validate(id) as boolean) {
      return id;
    }
    const pipeline = await this.getPipelineById(id);
    return pipeline.id;
  }
}
