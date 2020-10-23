import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { provide, inject, scope, ScopeEnum } from 'midway';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  PipelineStatus,
  EvaluateResult,
  compressTarFile,
  UniDataset,
  constants as CoreConstants,
  PluginStatus,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { PluginPackage, RunnableResponse, PluginRunnable } from '@pipcook/costa';
import { PipelineModel, PipelineEntity, QueryOptions } from '../model/pipeline';
import { JobModel, JobEntity } from '../model/job';
import { PluginManager } from './plugin';
import { Tracer, JobStatusChangeEvent } from './trace-manager';
import { pluginQueue } from '../utils';
import { UpdateParameter } from '../interface/pipeline';

interface SelectJobsFilter {
  pipelineId?: string;
}

interface GenerateOptions {
  modelPath: string;
  modelPlugin: PluginPackage;
  dataProcess?: PluginPackage;
  datasetProcess?: PluginPackage;
  pipeline: PipelineEntity;
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

interface RunnerOptions {
  job: JobEntity;
  pipeline: PipelineEntity;
  plugins: Partial<Record<PluginTypeI, PluginInfo>>;
  tracer: Tracer;
  runnable: PluginRunnable;
  datasetRoot: string;
}

interface ModelResult {
  model: RunnableResponse;
  modelPlugin: PluginPackage;
}

interface RunnerResult {
  output: any;
  dataset: any;
  modelPath: string;
  modelPlugin: PluginPackage;
  dataProcess: PluginPackage;
  datasetProcess: PluginPackage;
}

/**
 * job runner
 */
export class JobRunner {
  opts: RunnerOptions;
  constructor(
    opts: RunnerOptions) {
    this.opts = opts;
  }
  getParams(params: string | null, ...extra: object[]): object {
    if (params == null) {
      return Object.assign({}, ...extra);
    } else {
      return Object.assign(JSON.parse(params), ...extra);
    }
  }
  verifyPlugin (name: string): void {
    if (!this.opts.plugins[name]) {
      throw new TypeError(`"${name}" plugin is required`);
    }
  }
  dispatchJobEvent(jobStatus: PipelineStatus, step?: PluginTypeI, stepAction?: 'start' | 'end') {
    const jobEvent = new JobStatusChangeEvent(
      jobStatus,
      step,
      stepAction
    );
    this.opts.tracer.dispatch(jobEvent);
  }
  async runPlugin(type: PluginTypeI, ...args: any[]) {
    const plugin = this.opts.plugins[type].plugin;
    this.dispatchJobEvent(PipelineStatus.RUNNING, type, 'start');
    const result = await this.opts.runnable.start(plugin, ...args);
    this.dispatchJobEvent(PipelineStatus.RUNNING, type, 'end');
    return result;
  }

  async runDataCollect(dataDir: string, modelPath: string) {
    this.verifyPlugin('dataCollect');
    // ensure the model dir exists
    await fs.ensureDir(modelPath);
    // run dataCollect to download dataset.
    return this.runPlugin('dataCollect', this.getParams(this.opts.plugins.dataCollect.params, {
      dataDir
    }));
  }
  async runDataAccess(dataDir: string) {
    this.verifyPlugin('dataAccess');
    return this.runPlugin('dataAccess', this.getParams(this.opts.plugins.dataAccess.params, {
      dataDir
    }));
  }

  async runDatasetProcess(dataset: any) {
    if (this.opts.plugins.datasetProcess) {
      return this.runPlugin('datasetProcess', dataset, this.getParams(this.opts.plugins.datasetProcess.params));
    }
  }

  async runDataProcess(dataset: any) {
    if (this.opts.plugins.dataProcess) {
      await this.runPlugin('dataProcess', dataset, this.getParams(this.opts.plugins.dataProcess.params));
    }
  }

  async runModelDefine(dataset: any): Promise<ModelResult> {
    return {
      modelPlugin: this.opts.plugins.modelDefine.plugin,
      model: await this.runPlugin('modelDefine', dataset, this.getParams(this.opts.plugins.modelDefine.params))
    };
  }

  async runModelLoad(dataset: any, modelPath: string): Promise<ModelResult> {
    return {
      modelPlugin: this.opts.plugins.modelLoad.plugin,
      model: await this.runPlugin('modelLoad', dataset, this.getParams(this.opts.plugins.modelLoad.params, {
        // specify the recover path for model loader by default.
        recoverPath: modelPath
      }))
    };
  }

  async runModelTrain(dataset: any, model: RunnableResponse, modelPath: string) {
    return this.runPlugin('modelTrain', dataset, model, this.getParams(this.opts.plugins.modelTrain.params, {
      modelPath
    }));
  }

  async runModelEvaluate(dataset: any, model: RunnableResponse, modelPath: string): Promise<any> {
    this.verifyPlugin('modelEvaluate');
    return this.runPlugin('modelEvaluate', dataset, model, this.getParams(this.opts.plugins.modelEvaluate.params, {
      modelDir: modelPath
    }));
  }
  /**
   * Generate the output package for a given job.
   * @param job the job model for output.
   * @param opts the options to used for generating the output.
   */
  async generateOutput(job: JobEntity, opts: GenerateOptions) {
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
      pipeline: opts.pipeline,
      output: job,
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
  async run(): Promise<RunnerResult> {
    const dataDir = path.join(this.opts.datasetRoot, `${this.opts.plugins.dataCollect.plugin.name}@${this.opts.plugins.dataCollect.plugin.version}`);
    const modelPath = path.join(this.opts.runnable.workingDir, 'model');

    await this.runDataCollect(dataDir, modelPath);
    const dataset = await this.runDataAccess(dataDir);
    await this.runDatasetProcess(dataset);
    await this.runDataProcess(dataset);

    let modelResult: ModelResult;
    // select one of `ModelDefine` and `ModelLoad`.
    if (this.opts.plugins.modelDefine) {
      modelResult = await this.runModelDefine(dataset);
    } else if (this.opts.plugins.modelLoad) {
      modelResult = await this.runModelLoad(dataset, modelPath);
    }
    if (this.opts.plugins.modelTrain) {
      modelResult.model = await this.runModelTrain(dataset, modelResult.model, modelPath);
    }
    const output = await this.runModelEvaluate(dataset, modelResult.model, modelPath);
    return {
      output,
      dataset,
      modelPath,
      modelPlugin: modelResult.modelPlugin,
      dataProcess: this.opts.plugins.dataProcess?.plugin,
      datasetProcess: this.opts.plugins.datasetProcess?.plugin
    };
  }
}
@scope(ScopeEnum.Singleton)
@provide('pipelineService')
export class PipelineService {

  @inject('pluginManager')
  pluginManager: PluginManager;

  runnableMap: Record<string, PluginRunnable> = {};

  async createPipeline(config: PipelineEntity): Promise<PipelineEntity> {
    return PipelineModel.createPipeline(config);
  }

  async getPipeline(idOrName: string): Promise<PipelineEntity> {
    return PipelineModel.getPipeline(idOrName);
  }

  async queryPipelines(opts?: QueryOptions): Promise<PipelineEntity[]> {
    return PipelineModel.queryPipelines(opts);
  }

  async removePipelineById(id: string): Promise<number> {
    return PipelineModel.removePipelineById(id);
  }

  async removePipelines(): Promise<number> {
    return PipelineModel.removePipelines();
  }

  async updatePipelineById(id: string, config: UpdateParameter): Promise<PipelineEntity> {
    return PipelineModel.updatePipelineById(id, config);
  }

  async removeJobById(id: string): Promise<number> {
    const job = await JobModel.getJobById(id);
    if (job) {
      await Promise.all([
        JobModel.removeJobById(job.id),
        fs.remove(`${CoreConstants.PIPCOOK_RUN}/${job.id}`)
      ]);
      return 1;
    }
    return 0;
  }

  async getJobById(id: string): Promise<JobEntity> {
    return JobModel.getJobById(id);
  }

  async saveJob(job: JobEntity): Promise<void> {
    JobModel.saveJob(job);
  }

  async getJobsByPipelineId(pipelineId: string): Promise<JobEntity[]> {
    return JobModel.getJobsByPipelineId(pipelineId);
  }

  async queryJobs(filter: SelectJobsFilter, opts?: QueryOptions): Promise<JobEntity[]> {
    return JobModel.queryJobs(filter, opts);
  }

  async removeJobs(): Promise<number> {
    return JobModel.destroy({ truncate: true });
  }

  async removeJobByModels(jobs: JobEntity[]): Promise<number> {
    const ids = jobs.map(job => job.id);
    const fsRemoveFutures = [];
    for (const id of ids) {
      fsRemoveFutures.push(fs.remove(`${CoreConstants.PIPCOOK_RUN}/${id}`));
    }
    const deleteFuture = JobModel.removeJobByModels(jobs);
    const results = await Promise.all([
      deleteFuture,
      Promise.all(fsRemoveFutures)
    ]);
    return results[0];
  }
  async createJob(pipelineId: string): Promise<JobEntity> {
    const specVersion = (await fs.readJSON(path.join(__dirname, '../../package.json'))).version;
    return JobModel.createJob(pipelineId, specVersion);
  }

  async fetchPlugins(pipeline: PipelineEntity): Promise<Partial<Record<PluginTypeI, PluginInfo>>> {
    const plugins: Partial<Record<PluginTypeI, PluginInfo>> = {};
    const noneInstalledPlugins: string[] = [];
    for (const type of CoreConstants.PLUGINS) {
      if (pipeline[type]) {
        if (!pipeline[`${type}Id`]) {
          noneInstalledPlugins.push(pipeline[type]);
          continue;
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

  async startJob(job: JobEntity, pipeline: PipelineEntity, plugins: Partial<Record<PluginTypeI, PluginInfo>>, tracer: Tracer): Promise<void> {
    const runnable = await this.pluginManager.createRunnable(job.id, tracer);
    // save the runnable object
    this.runnableMap[job.id] = runnable;
    // update the job status to running
    job.status = PipelineStatus.RUNNING;
    await JobModel.saveJob(job);
    // creater runner
    const runner = new JobRunner({
      job,
      pipeline,
      plugins,
      tracer,
      runnable,
      datasetRoot: this.pluginManager.datasetRoot
    });

    runner.dispatchJobEvent(PipelineStatus.RUNNING);
    try {
      // step1: run job
      const {
        output,
        dataset,
        modelPath,
        modelPlugin,
        dataProcess,
        datasetProcess
      } = await runner.run();
      // step2: run finished, save job to database
      const result = await runnable.valueOf(output) as EvaluateResult;
      const datasetVal = await runnable.valueOf(dataset) as UniDataset;
      if (datasetVal?.metadata) {
        job.dataset = JSON.stringify(datasetVal.metadata);
      }
      job.evaluateMap = JSON.stringify(result);
      job.evaluatePass = result.pass;
      job.endTime = Date.now();
      job.status = PipelineStatus.SUCCESS;

      await JobModel.saveJob(job);
      // step3: generate output
      await runner.generateOutput(job, {
        modelPath,
        modelPlugin,
        dataProcess,
        datasetProcess,
        pipeline,
        workingDir: runnable.workingDir,
        template: 'node' // set node by default
      });
      // step4: all done
      runner.dispatchJobEvent(PipelineStatus.SUCCESS);
    } catch (err) {
      if (!runnable.canceled) {
        job.status = PipelineStatus.FAIL;
        job.error = err.message;
        await JobModel.saveJob(job);
        runner.dispatchJobEvent(PipelineStatus.FAIL);
      } else {
        runner.dispatchJobEvent(PipelineStatus.CANCELED);
      }
      throw err;
    } finally {
      await runnable.destroy();
      delete this.runnableMap[job.id];
    }
  }

  async stopJob(id: string): Promise<void> {
    const job = await JobModel.getJobById(id);
    if (job && job.status === PipelineStatus.RUNNING) {
      const runnable = this.runnableMap[id];
      if (runnable) {
        runnable.destroy();
        delete this.runnableMap[id];
      } else {
        console.error(`no runnable found: ${id}`);
      }
      job.status = PipelineStatus.CANCELED;
      await JobModel.saveJob(job);
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

  async runJob(job: JobEntity,
               pipeline: PipelineEntity,
               plugins: Partial<Record<PluginTypeI, PluginInfo>>,
               tracer: Tracer): Promise<void> {
    job.status = PipelineStatus.PENDING;
    await this.saveJob(job);
    return new Promise((resolve, reject) => {
      let queueLength = pluginQueue.length;
      const queueReporter = () => {
        queueLength--;
        if (queueLength > 0) {
          tracer.dispatch(new JobStatusChangeEvent(PipelineStatus.PENDING, undefined, undefined, queueLength));
        }
      };
      if (queueLength > 0) {
        pluginQueue.on('success', queueReporter);
        tracer.dispatch(new JobStatusChangeEvent(PipelineStatus.PENDING, undefined, undefined, queueLength));
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
