import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Op } from 'sequelize';
import { provide, inject } from 'midway';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  PipelineStatus,
  EvaluateResult,
  compressTarFile,
  UniDataset,
  constants as CoreConstants,
  generateId,
  PluginStatus,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { PluginPackage, RunnableResponse, PluginRunnable } from '@pipcook/costa';
import { PipelineModel, PipelineModelStatic } from '../model/pipeline';
import { JobModelStatic, JobModel } from '../model/job';
import { PluginManager } from './plugin';
import { Tracer, JobStatusChangeEvent } from './trace-manager';
import { pluginQueue } from '../utils';
import { PipelineDB } from '../runner/helper';

interface QueryOptions {
  limit: number;
  offset: number;
}

interface SelectJobsFilter {
  pipelineId?: string;
}

interface GenerateOptions {
  modelPath: string;
  modelPlugin: PluginPackage;
  dataProcess?: PluginPackage;
  datasetProcess?: PluginPackage;
  pipeline: PipelineModel;
  workingDir: string;
  template: string;
}

interface PluginInfo {
  plugin: PluginPackage;
  params: string;
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

  @inject('pluginManager')
  pluginManager: PluginManager;

  createPipeline(config: PipelineDB): Promise<PipelineModel> {
    if (typeof config.id !== 'string') {
      config.id = generateId();
    }
    return this.pipeline.create(config);
  }

  async getPipeline(idOrName: string): Promise<PipelineModel> {
    return this.pipeline.findOne({
      where: { [Op.or]: [ { id: idOrName }, { name: idOrName } ] }
    });
  }

  async queryPipelines(opts?: QueryOptions): Promise<PipelineModel[]> {
    const { offset, limit } = opts || {};
    return this.pipeline.findAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ],
      include: [
        {
          all: true
        }
      ]
    });
  }

  async removePipelineById(id: string): Promise<number> {
    return this.pipeline.destroy({
      where: { id }
    });
  }

  async removePipelines(): Promise<number> {
    const list = await this.queryPipelines();
    await list.map(async (pipeline: PipelineModel) => {
      await pipeline.destroy();
    });
    return list.length;
  }

  async updatePipelineById(id: string, config: PipelineDB): Promise<PipelineModel> {
    await this.pipeline.update(config, {
      where: { id }
    });
    return this.getPipeline(id);
  }

  async getJobById(id: string): Promise<JobModel> {
    return this.job.findOne({
      where: { id }
    });
  }

  async queryJobs(filter: SelectJobsFilter, opts?: QueryOptions): Promise<JobModel[]> {
    const where = {} as any;
    const { offset, limit } = opts || {};
    if (typeof filter.pipelineId === 'string') {
      where.pipelineId = filter.pipelineId;
    }
    return this.job.findAll({
      offset,
      limit,
      where,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    });
  }

  async removeJobs(): Promise<number> {
    const jobs = await this.queryJobs({});
    await jobs.map(async (job: JobModel) => {
      await job.destroy();
      fs.remove(`${CoreConstants.PIPCOOK_RUN}/${job.id}`);
    });
    return jobs.length;
  }

  async removeJobById(id: string): Promise<number> {
    const job = await this.job.findByPk(id);
    if (job) {
      await job.destroy();
      await fs.remove(`${CoreConstants.PIPCOOK_RUN}/${job.id}`);
      return 1;
    }
    return 0;
  }

  async createJob(pipelineId: string): Promise<JobModel> {
    const specVersion = (await fs.readJSON(path.join(__dirname, '../../package.json'))).version;
    const job = await this.job.create({
      id: generateId(),
      pipelineId,
      specVersion,
      status: PipelineStatus.INIT,
      currentIndex: -1
    });
    return job;
  }

  async fetchPlugins(pipeline: PipelineModel): Promise<Partial<Record<PluginTypeI, PluginInfo>>> {
    const plugins: Partial<Record<PluginTypeI, PluginInfo>> = {};
    const noneInstalledPlugins: string[] = [];
    for (const type of CoreConstants.PLUGINS) {
      if (pipeline[type]) {
        if (!pipeline[`${type}Id`]) {
          noneInstalledPlugins.push(pipeline[type]);
        }
        const plugin = await this.pluginManager.findById(pipeline[`${type}Id`]);
        if (plugin && plugin.status === PluginStatus.INSTALLED) {
          // ignore if any plugin not installed, because will throw an error after processing.
          if (noneInstalledPlugins.length === 0) {
            plugins[type] = await {
              plugin: await this.pluginManager.fetchFromInstalledPlugin(plugin.name),
              params: pipeline[`${type}Params`]
            };
          }
        } else {
          noneInstalledPlugins.push(pipeline[type]);
        }
      }
    }
    if (noneInstalledPlugins.length > 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, `these plugins are not installed: ${JSON.stringify(noneInstalledPlugins)}`);
    }
    return plugins;
  }

  async startJob(job: JobModel, pipeline: PipelineModel, plugins: Partial<Record<PluginTypeI, PluginInfo>>, tracer: Tracer): Promise<void> {
    const runnable = await this.pluginManager.createRunnable(job.id, tracer);
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
    const dispatchJobEvent = (jobStatus: PipelineStatus, step?: PluginTypeI, stepAction?: 'start' | 'end') => {
      const jobEvent = new JobStatusChangeEvent(
        jobStatus,
        step,
        stepAction
      );
      tracer.dispatch(jobEvent);
    };
    const run = async (type: PluginTypeI, ...args: any[]) => {
      const plugin = plugins[type].plugin;
      dispatchJobEvent(PipelineStatus.RUNNING, type, 'start');
      const result = await runnable.start(plugin, ...args);
      dispatchJobEvent(PipelineStatus.RUNNING, type, 'end');
      return result;
    };
    // update the job status to running
    job.status = PipelineStatus.RUNNING;
    await job.save();
    dispatchJobEvent(PipelineStatus.RUNNING);
    try {
      verifyPlugin('dataCollect');
      const dataDir = path.join(this.pluginManager.datasetRoot, `${plugins.dataCollect.plugin.name}@${plugins.dataCollect.plugin.version}`);
      const modelPath = path.join(runnable.workingDir, 'model');

      // ensure the model dir exists
      await fs.ensureDir(modelPath);

      // run dataCollect to download dataset.
      await run('dataCollect', getParams(plugins.dataCollect.params, {
        dataDir
      }));

      verifyPlugin('dataAccess');
      const dataset = await run('dataAccess', getParams(plugins.dataAccess.params, {
        dataDir
      }));

      let datasetProcess: PluginPackage;
      if (plugins.datasetProcess) {
        datasetProcess = plugins.datasetProcess.plugin;
        await run('datasetProcess', dataset, getParams(plugins.datasetProcess.params));
      }

      let dataProcess: PluginPackage;
      if (plugins.dataProcess) {
        dataProcess = plugins.dataProcess.plugin;
        await run('dataProcess', dataset, getParams(plugins.dataProcess.params));
      }

      let model: RunnableResponse;
      let modelPlugin: PluginPackage;

      // select one of `ModelDefine` and `ModelLoad`.
      if (plugins.modelDefine) {
        modelPlugin = plugins.modelDefine.plugin;
        model = await run('modelDefine', dataset, getParams(plugins.modelDefine.params));
      } else if (plugins.modelLoad) {
        modelPlugin = plugins.modelLoad.plugin;
        model = await run('modelLoad', dataset, getParams(plugins.modelLoad.params, {
          // specify the recover path for model loader by default.
          recoverPath: modelPath
        }));
      }

      if (plugins.modelTrain) {
        model = await run('modelTrain', dataset, model, getParams(plugins.modelTrain.params, {
          modelPath
        }));
      }

      verifyPlugin('modelEvaluate');
      const output = await run('modelEvaluate', dataset, model, getParams(plugins.modelEvaluate.params, {
        modelDir: modelPath
      }));

      // update job status to successful
      const result = await runnable.valueOf(output) as EvaluateResult;
      const datasetVal = await runnable.valueOf(dataset) as UniDataset;
      if (datasetVal?.metadata) {
        job.dataset = JSON.stringify(datasetVal.metadata);
      }
      job.evaluateMap = JSON.stringify(result);
      job.evaluatePass = result.pass;
      job.endTime = Date.now();
      job.status = PipelineStatus.SUCCESS;

      await this.generateOutput(job, {
        modelPath,
        modelPlugin,
        dataProcess,
        datasetProcess,
        pipeline,
        workingDir: runnable.workingDir,
        template: 'node' // set node by default
      });

      await job.save();
      dispatchJobEvent(PipelineStatus.SUCCESS);
    } catch (err) {
      if (!runnable.canceled) {
        job.status = PipelineStatus.FAIL;
        job.error = err.message;
        await job.save();
        dispatchJobEvent(PipelineStatus.FAIL);
      } else {
        dispatchJobEvent(PipelineStatus.CANCELED);
      }
      throw err;
    } finally {
      await runnable.destroy();
      delete runnableMap[job.id];
    }
  }

  async stopJob(id: string): Promise<void> {
    const job = await this.getJobById(id);
    if (job && job.status === PipelineStatus.RUNNING) {
      const runnable = runnableMap[id];
      if (runnable) {
        runnable.destroy();
        delete runnableMap[id];
      } else {
        console.error(`no runnable found: ${id}`);
      }
      job.status = PipelineStatus.CANCELED;
      await job.save();
    } else {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'job is not running');
    }
  }

  /**
   * Get the output tar pathname by job id.
   * @param id the job id
   */
  getOutputTarByJobId(id: string): string {
    return path.join(CoreConstants.PIPCOOK_RUN, id, 'output.tar.gz');
  }

  /**
   * Generate the output package for a given job.
   * @param job the job model for output.
   * @param opts the options to used for generating the output.
   */
  async generateOutput(job: JobModel, opts: GenerateOptions) {
    // start generates the output directory
    const dist = path.join(opts.workingDir, 'output');
    await fs.remove(dist);
    await fs.ensureDir(dist);
    await execAsync('npm init -y', { cwd: dist });

    // post processing the package.json
    const projPackage = await fs.readJSON(dist + '/package.json');
    projPackage.dependencies = {
      [opts.modelPlugin.name]: opts.modelPlugin.version,
    };
    projPackage.scripts = {
      postinstall: 'node boapkg.js'
    };
    if (opts.dataProcess) {
      projPackage.dependencies[opts.dataProcess.name] = opts.dataProcess.version;
    }

    const jsonWriteOpts = { spaces: 2 } as fs.WriteOptions;
    const metadata = {
      pipeline: opts.pipeline.toJSON(),
      output: job.toJSON(),
    };

    await Promise.all([
      // copy base components
      fs.copy(opts.modelPath, dist + '/model'),
      fs.copy(path.join(__dirname, `../../templates/${opts.template}/predict.js`), `${dist}/index.js`),
      fs.copy(path.join(__dirname, '../../templates/boapkg.js'), `${dist}/boapkg.js`),
      // copy logs
      fs.copy(opts.workingDir + '/logs', `${dist}/logs`),
      // write package.json
      fs.outputJSON(dist + '/package.json', projPackage, jsonWriteOpts),
      // write metadata.json
      fs.outputJSON(dist + '/metadata.json', metadata, jsonWriteOpts),
    ]);
    console.info(`trained the model to ${dist}`);

    // packing the output directory.
    await compressTarFile(dist, path.join(opts.workingDir, 'output.tar.gz'));
  }

  async getLogById(id: string): Promise<string[]> {
    const stdout = path.join(CoreConstants.PIPCOOK_RUN, id, 'logs/stdout.log');
    const stderr = path.join(CoreConstants.PIPCOOK_RUN, id, 'logs/stderr.log');
    if (await fs.pathExists(stdout) && await fs.pathExists(stderr)) {
      return [
        await fs.readFile(stderr, 'utf8'),
        await fs.readFile(stdout, 'utf8')
      ];
    } else {
      throw createHttpError(HttpStatus.NOT_FOUND, 'log not found');
    }
  }

  async runJob(job: JobModel,
               pipeline: PipelineModel,
               plugins: Partial<Record<PluginTypeI, PluginInfo>>,
               tracer: Tracer): Promise<void> {
    job.status = PipelineStatus.PENDING;
    await job.save();
    return new Promise((resolve, reject) => {
      let queueLength = pluginQueue.length;
      const queueReporter = () => {
        tracer.dispatch(new JobStatusChangeEvent(PipelineStatus.PENDING, undefined, undefined, --queueLength));
      };
      if (queueLength > 0) {
        pluginQueue.on('success', queueReporter);
      }
      pluginQueue.push((cb) => {
        pluginQueue.removeListener('success', queueReporter);
        this.startJob(job, pipeline, plugins, tracer).then(() => {
          resolve();
          cb();
        }).catch((err) => {
          reject(err);
          cb();
        });
      });
    });
  }
}
