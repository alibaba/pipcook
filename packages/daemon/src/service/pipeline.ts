import { provide, inject } from 'midway';
import { PipelineDB, constants, PipelineStatus } from '@pipcook/pipcook-core';
import * as path from 'path';
import { fork } from 'child_process';
import * as validate from 'uuid-validate';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';

import { MODULE_PATH } from '../utils/tools';
import { RunParams } from '../interface';
import { writeOutput, retriveLog } from '../runner/helper';
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
    return this.model.findOne({
      where: getIdOrName(id)
    });
  }

  async getPipelines(offset: number, limit: number): Promise<{rows: PipelineModel[], count: number}> {
    return this.model.findAndCountAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
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
    return this.getPipelineById(id);
  }

  async getJobById(id: string): Promise<JobModel> {
    return this.job.findOne({
      where: { id }
    });
  }

  async getJobsByPipelineId(id: string, offset: number, limit: number): Promise<{rows: JobModel[], count: number}> {
    const pipelineId = await this.getPipelineId(id);
    return this.job.findAndCountAll({
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
    return this.job.findAndCountAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    });
  }

  async updateJobById(id: string, data: RunParams): Promise<JobModel> {
    await this.job.update(data, {
      where: { id }
    });
    return this.getJobById(id);
  }

  async createJob(id: string): Promise<JobModel> {
    const pipelineId = await this.getPipelineId(id);
    const specVersion = (await fs.readJSON(path.join(__dirname, '../../package.json'))).version;
    const job = await this.job.create({
      id: uuidv1(),
      pipelineId,
      specVersion,
      status: PipelineStatus.INIT,
      currentIndex: -1
    });
    await fs.ensureFile(path.join(PIPCOOK_LOGS, job.id, 'stderr'));
    await fs.ensureFile(path.join(PIPCOOK_LOGS, job.id, 'stdout'));
    return job;
  }

  async startJob(job: JobModel) {
    const pipelineRecord = await this.getPipelineById(job.pipelineId);
    const script = path.join(__dirname, '..', '..', 'assets', 'runConfig.js');
    await new Promise((resolve, reject) => {
      const child = fork(script, [ job.pipelineId, job.id, JSON.stringify(pipelineRecord), 'run-pipeline' ], {
        silent: true,
        cwd: path.join(process.cwd(), '..', '..'),
        env: {
          NODE_PATH: MODULE_PATH
        }
      });
      child.stdout.on('data', async (data) => {
        await writeOutput(job.id, data);
      });
      child.stderr.on('data', async (data) => {
        await writeOutput(job.id, data);
        await writeOutput(job.id, data, true);
      });
      child.on('message', async (data: any) => {
        if (data.type === 'pipeline-status') {
          await this.updateJobById(job.id, data.data);
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
