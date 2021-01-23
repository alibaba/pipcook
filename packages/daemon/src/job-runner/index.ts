import * as path from 'path';
import * as fs from 'fs-extra';
import {
  PipelineStatus,
  PluginTypeI,
  UniDataset
} from '@pipcook/pipcook-core';
import { PluginPackage, RunnableResponse, PluginRunnable } from '@pipcook/costa';
import { Pipeline, Job, JobParam } from '../models';
import { Tracer, JobStatusChangeEvent } from '../services';
import { copyDir } from '../utils';

/**
 * plugin info from pipeline config
 */
export interface PluginInfo {
  plugin: PluginPackage;
  params: Record<string, unknown> | undefined;
}

/**
 * Runner options
 */
export interface RunnerOptions {
  job: Job;
  pipeline: Pipeline;
  plugins: Partial<Record<PluginTypeI, PluginInfo>>;
  tracer: Tracer;
  runnable: PluginRunnable;
  datasetRoot: string;
}

/**
 * model define and model load plugin result
 */
export interface ModelResult {
  model: RunnableResponse;
  plugin: PluginPackage;
}

/**
 * job run result
 */
export interface JobResult {
  evaluateOutput: any;
  dataset: any;
  modelPath: string;
  plugins: {
    modelDefine: PluginPackage;
    dataProcess?: PluginPackage;
    datasetProcess?: PluginPackage;
  };
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
   * @param params param from config
   * @param extra extra config from pipeline running
   */
  getParams(params?: Record<string, unknown> | null | undefined, ...extra: Record<string, unknown>[]): Record<string, unknown> {
    if (!params) {
      return Object.assign({}, ...extra);
    } else {
      return Object.assign(params, ...extra);
    }
  }

  /**
   * check if the plugin is configured, throw error if not
   * @param name plugin name
   */
  assertPlugin(name: PluginTypeI): void {
    if (!this.opts.plugins[name]) {
      throw new TypeError(`"${name}" plugin is required`);
    }
  }

  /**
   * extract plugin specific param from job param
   * @param type plugin type
   * @param params job param
   */
  private findParamsByType(type: PluginTypeI, params?: JobParam[]): Record<string, unknown>[] {
    return params ? params.filter((it) => it.pluginType === type).map((it) => it.data) : [];
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
    const plugin = this.opts.plugins[type]?.plugin;
    if (!plugin) {
      throw new TypeError(`plugin ${type} is not specified`);
    }
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

    const params = this.findParamsByType('dataCollect', this.opts.job.params);

    // ensure the model dir exists
    await fs.ensureDir(modelPath);
    // run dataCollect to download dataset.
    await this.runPlugin('dataCollect', this.getParams(this.opts.plugins.dataCollect?.params, {
      dataDir
    }, ...params));
  }

  /**
   * run data access plugin
   * @param dataDir data dir
   */
  async runDataAccess(dataDir: string): Promise<UniDataset> {
    this.assertPlugin('dataAccess');

    const params = this.findParamsByType('dataAccess', this.opts.job.params);

    return this.runPlugin('dataAccess', this.getParams(this.opts.plugins.dataAccess?.params, {
      dataDir
    }, ...params));
  }

  /**
   * run dataset process plugin
   * @param dataset dataset from data collect plugin
   */
  async runDatasetProcess(dataset: UniDataset): Promise<void> {
    if (this.opts.plugins.datasetProcess) {
      const params = this.findParamsByType('datasetProcess', this.opts.job.params);

      await this.runPlugin('datasetProcess', dataset, this.getParams(this.opts.plugins.datasetProcess.params, ...params));
    }
  }

  /**
   * run data process plugin
   * @param dataset dataset from data collect plugin
   */
  async runDataProcess(dataset: UniDataset): Promise<void> {
    if (this.opts.plugins.dataProcess) {
      const params = this.findParamsByType('dataProcess', this.opts.job.params);

      await this.runPlugin('dataProcess', dataset, this.getParams(this.opts.plugins.dataProcess.params, ...params));
    }
  }

  /**
   * run model define plugin, return plugin and model
   * @param dataset dataset from data collect/dataset process/data process plugin
   */
  async runModelDefine(dataset: UniDataset): Promise<ModelResult> {
    const params = this.findParamsByType('modelDefine', this.opts.job.params);

    return {
      plugin: this.opts.plugins.modelDefine?.plugin as PluginPackage,
      model: await this.runPlugin('modelDefine', dataset, this.getParams(this.opts.plugins.modelDefine?.params, ...params))
    };
  }

  /**
   * run model train plugin and return model
   * @param dataset dataset from data collect/dataset process/data process plugin
   * @param model model from model define
   * @param modelPath where the model saves to
   */
  async runModelTrain(dataset: UniDataset, model: RunnableResponse, modelPath: string): Promise<any> {
    const params = this.findParamsByType('modelTrain', this.opts.job.params);

    return this.runPlugin('modelTrain', dataset, model, this.getParams(this.opts.plugins.modelTrain?.params, {
      modelPath
    }, ...params));
  }

  /**
   * run model evalute plugin and return evaluation results
   * @param dataset dataset from data collect/dataset process/data process plugin
   * @param model model from model define
   * @param modelPath where the model loads from
   */
  async runModelEvaluate(dataset: UniDataset, model: RunnableResponse, modelPath: string): Promise<any> {
    this.assertPlugin('modelEvaluate');

    return this.runPlugin('modelEvaluate', dataset, model, this.getParams(this.opts.plugins.modelEvaluate?.params, {
      modelDir: modelPath
    }));
  }

  /**
   * run the pipeline
   */
  async run(): Promise<JobResult> {
    if (typeof this.opts.plugins.dataCollect !== 'object') {
      throw new TypeError('plugin dataCollect must be specified');
    }
    if (!this.opts.plugins.modelDefine) {
      throw new TypeError('plugin modelDefine must be specified.');
    }
    const dataDir = path.join(this.opts.datasetRoot, `${this.opts.plugins.dataCollect.plugin.name}@${this.opts.plugins.dataCollect.plugin.version}`);
    const modelPath = path.join(this.opts.runnable.workingDir, 'model');

    await this.runDataCollect(dataDir, modelPath);

    // move plugin data directory data to job's data directory
    await copyDir(dataDir, this.opts.runnable.dataDir);

    const dataset = await this.runDataAccess(this.opts.runnable.dataDir);
    await this.runDatasetProcess(dataset);
    await this.runDataProcess(dataset);

    let modelResult: ModelResult;
    // select one of `ModelDefine` and `ModelLoad`.
    modelResult = await this.runModelDefine(dataset);

    if (this.opts.plugins.modelTrain) {
      modelResult.model = await this.runModelTrain(dataset, modelResult.model, modelPath);
    }
    const evaluateOutput = await this.runModelEvaluate(dataset, modelResult.model, modelPath);
    return {
      evaluateOutput,
      dataset,
      modelPath,
      plugins: {
        modelDefine: modelResult.plugin,
        dataProcess: this.opts.plugins.dataProcess?.plugin,
        datasetProcess: this.opts.plugins.datasetProcess?.plugin
      }
    };
  }
}
