import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as validate from 'uuid-validate';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';

import { provide, inject } from 'midway';
import { PipelineDB, PipelineStatus, EvaluateResult } from '@pipcook/pipcook-core';

import { RunParams } from '../interface';
import { PipelineModel, PipelineModelStatic } from '../model/pipeline';
import { JobModelStatic, JobModel } from '../model/job';
import PluginRuntime from '../boot/plugin';
import { PluginPackage, RunnableResponse } from '@pipcook/costa';
import { BootstrapArg } from '@pipcook/costa/dist/runnable';
import { PIPCOOK_RUN_DIR } from '../utils/constants';

type QueryParams = { id: string, name?: string } | { id?: string, name: string };

function getIdOrName(id: string): QueryParams {
  if (!id) {
    throw new Error('id or name cannot be empty');
  }
  return validate(id) as boolean ? { id } : { name: id };
}

function execAsync(cmd: string, opts: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string, stderr: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}

@provide('pipelineService')
export class PipelineService {

  @inject('pipelineModel')
  model: PipelineModelStatic;

  @inject('jobModel')
  job: JobModelStatic;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

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
    job.runnable = await this.pluginRT.costa.createRunnable({ id: job.id } as BootstrapArg);
    return job;
  }

  async deleteAllJobs(): Promise<void> {
    await JobModel.destroy({ truncate: true });
    return null;
  }

  async startJob(job: JobModel, cwd: string) {
    const { runnable } = job;
    const { costa } = this.pluginRT;
    const pipeline = await this.getPipelineById(job.pipelineId);
    const getParams = (params: string | null, ...extra: object[]): object => {
      if (params == null) {
        return Object.assign({}, ...extra);
      } else {
        return Object.assign(JSON.parse(params), ...extra);
      }
    };
    const verifyPlugin = (name: string): void => {
      if (!pipeline[name]) {
        throw new TypeError(`"${name}" plugin is required`);
      }
    };

    verifyPlugin('dataCollect');
    const dataCollect = await costa.fetchAndInstall(pipeline.dataCollect, cwd);
    const dataDir = path.join(costa.options.datasetDir, `${dataCollect.name}@${dataCollect.version}`);
    const modelPath = path.join(runnable.workingDir, 'model');

    // run dataCollect to download dataset.
    await runnable.start(dataCollect, getParams(pipeline.dataCollectParams, {
      dataDir
    }));

    verifyPlugin('dataAccess');
    const dataAccess = await costa.fetchAndInstall(pipeline.dataAccess, cwd);
    let dataset = await runnable.start(dataAccess, getParams(pipeline.dataAccessParams, {
      dataDir
    }));

    let dataProcess: PluginPackage;
    if (pipeline.dataProcess) {
      dataProcess = await costa.fetchAndInstall(pipeline.dataProcess, cwd);
      dataset = await runnable.start(dataProcess, getParams(pipeline.dataProcessParams));
    }

    let model: RunnableResponse;
    let modelPlugin: PluginPackage;

    // select one of `ModelDefine` and `ModelLoad`.
    if (pipeline.modelDefine) {
      modelPlugin = await costa.fetchAndInstall(pipeline.modelDefine, cwd);
      model = await runnable.start(modelPlugin, dataset, getParams(pipeline.modelDefineParams));
    } else if (pipeline.modelLoad) {
      modelPlugin = await costa.fetchAndInstall(pipeline.modelLoad, cwd);
      model = await runnable.start(modelPlugin, dataset, getParams(pipeline.modelLoadParams, {
        // specify the recover path for model loader by default.
        recoverPath: modelPath
      }));
    }

    if (pipeline.modelTrain) {
      const modelTrain = await costa.fetchAndInstall(pipeline.modelTrain, cwd);
      model = await runnable.start(modelTrain, dataset, model, getParams(pipeline.modelTrainParams, {
        modelPath
      }));
    }

    verifyPlugin('modelEvaluate');
    const modelEvaluate = await costa.fetchAndInstall(pipeline.modelEvaluate, cwd);
    const output = await runnable.start(modelEvaluate, dataset, model, getParams(pipeline.modelEvaluateParams, {
      modelDir: modelPath
    }));

    const result = await runnable.valueOf(output) as EvaluateResult;
    job.evaluateMap = JSON.stringify(result);
    job.evaluatePass = result.pass;
    job.endTime = Date.now();
    job.status = 1;
    await job.save();

    // start generates the output directory
    const dist = path.join(cwd, 'output');
    await fs.remove(dist);
    await fs.ensureDir(dist);
    await execAsync('npm init -y', { cwd: dist });

    // post processing the package.json
    const projPackage = await fs.readJSON(dist + '/package.json');
    projPackage.dependencies = {
      [modelPlugin.name]: modelPlugin.version,
    };
    if (dataProcess) {
      projPackage.dependencies[dataProcess.name] = dataProcess.version;
    }

    const jsonWriteOpts = { spaces: 2 } as fs.WriteOptions;
    const metadata = {
      cwd,
      pipeline: pipeline.toJSON(),
      output: job.toJSON(),
    };

    await [
      // copy base components
      fs.copy(modelPath, dist + '/model'),
      fs.copy(path.join(__dirname, '../../assets/predict.js'), `${dist}/index.js`),
      // copy logs
      fs.copy(runnable.workingDir + '/logs', `${dist}/logs`),
      // write package.json
      fs.outputJSON(dist + '/package.json', projPackage, jsonWriteOpts),
      // write metadata.json
      fs.outputJSON(dist + '/metadata.json', metadata, jsonWriteOpts),
    ];
    await runnable.destroy();
    console.log(`trained the model to ${dist}`);
  }

  async getLogById(id: string): Promise<string[]> {
    const stdout = path.join(PIPCOOK_RUN_DIR, id, 'logs/stdout.log');
    const stderr = path.join(PIPCOOK_RUN_DIR, id, 'logs/stderr.log');
    return [
      await fs.readFile(stdout, 'utf8'),
      await fs.readFile(stderr, 'utf8')
    ];
  }

  async getPipelineId(id: string): Promise<string> {
    if (validate(id) as boolean) {
      return id;
    }
    const pipeline = await this.getPipelineById(id);
    return pipeline.id;
  }
}
