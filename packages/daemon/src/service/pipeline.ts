import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as validate from 'uuid-validate';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';

import { provide, inject } from 'midway';
import { PipelineDB, PipelineStatus, EvaluateResult, PluginTypeI, constants } from '@pipcook/pipcook-core';
import { PluginPackage, RunnableResponse, PluginRunnable } from '@pipcook/costa';

import { RunParams } from '../interface';
import { PipelineModel, PipelineModelStatic } from '../model/pipeline';
import { JobModelStatic, JobModel } from '../model/job';
import { PluginManager } from './plugin';
import { PIPCOOK_RUN_DIR } from '../utils/constants';

interface QueryOptions {
  limit: number;
  offset: number;
}

interface SelectJobsFilter {
  pipelineId?: string;
}

interface GenerateOptions {
  cwd: string;
  modelPath: string;
  modelPlugin: PluginPackage;
  dataProcess?: PluginPackage;
  pipeline: PipelineModel;
  workingDir: string;
}

type QueryParams = { id: string, name?: string } | { id?: string, name: string };

interface PluginInfo {
  plugin: PluginPackage;
  params: string;
}

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

const runnableMap: Record<string, PluginRunnable> = {};

@provide('pipelineService')
export class PipelineService {

  @inject('pipelineModel')
  pipeline: PipelineModelStatic;

  @inject('jobModel')
  job: JobModelStatic;

  @inject('PluginManager')
  pluginManager: PluginManager;

  createPipeline(config: PipelineDB): Promise<PipelineModel> {
    return this.pipeline.create(config);
  }

  async getPipeline(id: string): Promise<PipelineModel> {
    return this.pipeline.findOne({
      where: getIdOrName(id)
    });
  }

  async queryPipelines(opts?: QueryOptions): Promise<{rows: PipelineModel[], count: number}> {
    const { offset, limit } = opts || {};
    return this.pipeline.findAndCountAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    });
  }

  async removePipelineById(id: string): Promise<void> {
    await this.pipeline.destroy({
      where: getIdOrName(id)
    });
  }

  async removePipelines(): Promise<number> {
    const list = await this.queryPipelines();
    await list.rows.map(async (pipeline: PipelineModel) => {
      await pipeline.destroy();
    });
    return list.count;
  }

  async updatePipelineById(id: string, config: PipelineDB): Promise<PipelineModel> {
    await this.pipeline.update(config, {
      where: getIdOrName(id)
    });
    return this.getPipeline(id);
  }

  async getJobById(id: string): Promise<JobModel> {
    return this.job.findOne({
      where: { id }
    });
  }

  async queryJobs(filter: SelectJobsFilter, opts?: QueryOptions): Promise<{rows: JobModel[], count: number}> {
    const where = {} as any;
    const { offset, limit } = opts || {};
    if (typeof filter.pipelineId === 'string') {
      where.pipelineId = filter.pipelineId;
    }
    return this.job.findAndCountAll({
      offset,
      limit,
      where,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    });
  }

  async removeJobs(): Promise<void> {
    const jobs = await this.queryJobs({});
    await jobs.rows.map(async (job: JobModel) => {
      await job.destroy();
      await fs.remove(`${PIPCOOK_RUN_DIR}/${job.id}`);
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
    return job;
  }

  async installPlugins(job: JobModel, cwd: string, pyIndex?: string): Promise<Partial<Record<PluginTypeI, PluginInfo>>> {
    const pipeline = await this.getPipeline(job.pipelineId);
    const plugins: Partial<Record<PluginTypeI, PluginInfo>> = {};
    await Promise.all(constants.PLUGINS.map(async (type) => {
      if (pipeline[type]) {
        plugins[type] = await {
          plugin: await this.pluginManager.fetchAndInstall(pipeline[type], cwd, pyIndex),
          params: pipeline[`${type}Params`]
        };
      }
    }));
    return plugins;
  }

  async startJob(job: JobModel, cwd: string, plugins: Partial<Record<PluginTypeI, PluginInfo>>) {
    const runnable = await this.pluginManager.createRunnable(job.id);
    // save the runnable object
    runnableMap[job.id] = runnable;

    const getParams = (params: string | null, ...extra: object[]): object => {
      if (params == null) {
        return Object.assign({}, ...extra);
      } else {
        return Object.assign(JSON.parse(params), ...extra);
      }
    };
    const verifyPlugin = (name: string): void => {
      if (!plugins[name]) {
        runnableMap[job.id].destroy();
        throw new TypeError(`"${name}" plugin is required`);
      }
    };

    // update the job status to running
    job.status = PipelineStatus.RUNNING;
    await job.save();

    try {
      verifyPlugin('dataCollect');
      const dataDir = path.join(this.pluginManager.datasetRoot, `${plugins.dataCollect.plugin.name}@${plugins.dataCollect.plugin.version}`);
      const modelPath = path.join(runnable.workingDir, 'model');

      // ensure the model dir exists
      await fs.ensureDir(modelPath);

      // run dataCollect to download dataset.
      await runnable.start(plugins.dataCollect.plugin, getParams(plugins.dataCollect.params, {
        dataDir
      }));

      verifyPlugin('dataAccess');
      const dataset = await runnable.start(plugins.dataAccess.plugin, getParams(plugins.dataAccess.params, {
        dataDir
      }));

      if (plugins.dataProcess) {
        await runnable.start(plugins.dataProcess.plugin, dataset, getParams(plugins.dataProcess.params));
      }

      let model: RunnableResponse;
      let modelPlugin: PluginPackage;

      // select one of `ModelDefine` and `ModelLoad`.
      if (plugins.modelDefine) {
        modelPlugin = plugins.modelDefine.plugin;
        model = await runnable.start(plugins.modelDefine.plugin, dataset, getParams(plugins.modelDefine.params));
      } else if (plugins.modelLoad) {
        modelPlugin = plugins.modelLoad.plugin;
        model = await runnable.start(plugins.modelLoad.plugin, dataset, getParams(plugins.modelLoad.params, {
          // specify the recover path for model loader by default.
          recoverPath: modelPath
        }));
      }

      if (plugins.modelTrain) {
        model = await runnable.start(plugins.modelTrain.plugin, dataset, model, getParams(plugins.modelTrain.params, {
          modelPath
        }));
      }

      verifyPlugin('modelEvaluate');
      const output = await runnable.start(plugins.modelEvaluate.plugin, dataset, model, getParams(plugins.modelEvaluate.params, {
        modelDir: modelPath
      }));

      const result = await runnable.valueOf(output) as EvaluateResult;
      job.evaluateMap = JSON.stringify(result);
      job.evaluatePass = result.pass;
      job.endTime = Date.now();
      job.status = PipelineStatus.SUCCESS;
      await job.save();
      const pipeline = await this.getPipeline(job.pipelineId);
      await this.generateOutput(job, {
        cwd,
        modelPath,
        modelPlugin,
        pipeline,
        workingDir: runnable.workingDir
      });
    } catch (err) {
      job.status = PipelineStatus.FAIL;
      job.error = err.message;
      await job.save();
      throw err;
    } finally {
      await runnable.destroy();
      delete runnableMap[job.id];
    }
  }

  stopJob(id: string): boolean {
    const runnable = runnableMap[id];
    if (runnable) {
      runnable.destroy();
      delete runnableMap[id];
      return true;
    } else {
      return false;
    }
  }

  async generateOutput(job: JobModel, opts: GenerateOptions) {
    // start generates the output directory
    const dist = path.join(opts.cwd, 'output');
    await fs.remove(dist);
    await fs.ensureDir(dist);
    await execAsync('npm init -y', { cwd: dist });

    // post processing the package.json
    const projPackage = await fs.readJSON(dist + '/package.json');
    projPackage.dependencies = {
      [opts.modelPlugin.name]: opts.modelPlugin.version,
    };
    if (opts.dataProcess) {
      projPackage.dependencies[opts.dataProcess.name] = opts.dataProcess.version;
    }

    const jsonWriteOpts = { spaces: 2 } as fs.WriteOptions;
    const metadata = {
      cwd: opts.cwd,
      pipeline: opts.pipeline.toJSON(),
      output: job.toJSON(),
    };

    await [
      // copy base components
      fs.copy(opts.modelPath, dist + '/model'),
      fs.copy(path.join(__dirname, '../../assets/predict.js'), `${dist}/index.js`),
      // copy logs
      fs.copy(opts.workingDir + '/logs', `${dist}/logs`),
      // write package.json
      fs.outputJSON(dist + '/package.json', projPackage, jsonWriteOpts),
      // write metadata.json
      fs.outputJSON(dist + '/metadata.json', metadata, jsonWriteOpts),
    ];
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
    const pipeline = await this.getPipeline(id);
    return pipeline.id;
  }
}
