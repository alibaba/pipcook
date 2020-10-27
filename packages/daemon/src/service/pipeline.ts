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
  plugin: PluginPackage;
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
 * handle the pipeline running: check pipeline config, load and run plugins, dispatch pipeline running event.
 */
export class JobRunner {
  opts: RunnerOptions;
  constructor(opts: RunnerOptions) {
    this.opts = opts;
  }

  /**
   * assign the params
   * @param params param string from config
   * @param extra extra config from pipeline running
   */
  getParams(params: string | null, ...extra: object[]): object {
    if (params == null) {
      return Object.assign({}, ...extra);
    } else {
      return Object.assign(JSON.parse(params), ...extra);
    }
  }

  /**
   * check if the plugin is configured, throw error if not
   * @param name plugin name
   */
  assertPlugin (name: string): void {
    if (!this.opts.plugins[name]) {
      throw new TypeError(`"${name}" plugin is required`);
    }
  }

  /**
   * dispatch plugin running events
   * @param jobStatus job status
   * @param step which step the pipeline belongs
   * @param stepAction what action the plugin takes
   */
  dispatchJobEvent(jobStatus: PipelineStatus, step?: PluginTypeI, stepAction?: 'start' | 'end'): void {
    const jobEvent = new JobStatusChangeEvent(
      jobStatus,
      step,
      stepAction
    );
    this.opts.tracer.dispatch(jobEvent);
  }

  /**
   * run plugin with args
   * @param type plugin type
   * @param args args for plugin running
   */
  async runPlugin(type: PluginTypeI, ...args: any[]): Promise<any> {
    const plugin = this.opts.plugins[type].plugin;
    this.dispatchJobEvent(PipelineStatus.RUNNING, type, 'start');
    const result = await this.opts.runnable.start(plugin, ...args);
    this.dispatchJobEvent(PipelineStatus.RUNNING, type, 'end');
    return result;
  }

  /**
   * run data collect plugin
   * @param dataDir data dir
   * @param modelPath model path
   */
  async runDataCollect(dataDir: string, modelPath: string): Promise<any> {
    this.assertPlugin('dataCollect');
    // ensure the model dir exists
    await fs.ensureDir(modelPath);
    // run dataCollect to download dataset.
    await this.runPlugin('dataCollect', this.getParams(this.opts.plugins.dataCollect.params, {
      dataDir
    }));
  }

  /**
   * run data access plugin
   * @param dataDir data dir
   */
  async runDataAccess(dataDir: string): Promise<any> {
    this.assertPlugin('dataAccess');
    return this.runPlugin('dataAccess', this.getParams(this.opts.plugins.dataAccess.params, {
      dataDir
    }));
  }

  /**
   * run dataset process plugin
   * @param dataset dataset from data collect plugin
   */
  async runDatasetProcess(dataset: any): Promise<void> {
    if (this.opts.plugins.datasetProcess) {
      await this.runPlugin('datasetProcess', dataset, this.getParams(this.opts.plugins.datasetProcess.params));
    }
  }

  /**
   * run data process plugin
   * @param dataset dataset from data collect plugin
   */
  async runDataProcess(dataset: any): Promise<void> {
    if (this.opts.plugins.dataProcess) {
      await this.runPlugin('dataProcess', dataset, this.getParams(this.opts.plugins.dataProcess.params));
    }
  }

  /**
   * run model define plugin
   * @param dataset dataset from data collect/dataset process/data process plugin
   */
  async runModelDefine(dataset: any): Promise<ModelResult> {
    return {
      plugin: this.opts.plugins.modelDefine.plugin,
      model: await this.runPlugin('modelDefine', dataset, this.getParams(this.opts.plugins.modelDefine.params))
    };
  }

  /**
   * run the model load plugin, return 
   * @param dataset dataset from data collect/dataset process/data process plugin
   * @param modelPath where the model loads from
   */
  async runModelLoad(dataset: any, modelPath: string): Promise<ModelResult> {
    return {
      plugin: this.opts.plugins.modelLoad.plugin,
      model: await this.runPlugin('modelLoad', dataset, this.getParams(this.opts.plugins.modelLoad.params, {
        // specify the recover path for model loader by default.
        recoverPath: modelPath
      }))
    };
  }

  /**
   * run model train plugin and return model
   * @param dataset dataset from data collect/dataset process/data process plugin
   * @param model model from model define
   * @param modelPath where the model saves to
   */
  async runModelTrain(dataset: any, model: RunnableResponse, modelPath: string): Promise<any> {
    return this.runPlugin('modelTrain', dataset, model, this.getParams(this.opts.plugins.modelTrain.params, {
      modelPath
    }));
  }

  /**
   * run model evalute plugin and return evaluation results
   * @param dataset dataset from data collect/dataset process/data process plugin
   * @param model model from model define
   * @param modelPath where the model loads from
   */
  async runModelEvaluate(dataset: any, model: RunnableResponse, modelPath: string): Promise<any> {
    this.assertPlugin('modelEvaluate');
    return this.runPlugin('modelEvaluate', dataset, model, this.getParams(this.opts.plugins.modelEvaluate.params, {
      modelDir: modelPath
    }));
  }

  /**
   * run the pipeline
   */
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
      modelPlugin: modelResult.plugin,
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

  /**
   * Generate the output package for a given job.
   * @param job the job model for output.
   * @param opts the options to used for generating the output.
   */
  async generateOutput(job: JobEntity, opts: GenerateOptions): Promise<void> {
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
      await this.generateOutput(job, {
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
