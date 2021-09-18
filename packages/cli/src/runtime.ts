import * as fs from 'fs-extra';
import { PipelineMeta, Costa, PipelineWorkSpace, ScriptConfig } from '@pipcook/costa';
import { TaskType, PredictResult, DatasetPool } from '@pipcook/core';
import * as path from 'path';
import { createStandaloneRT } from './standalone-impl';
import { logger, Framework, Plugin, Script } from './utils';
import * as constants from './constants';

/**
 * Standalone runtime construct options.
 */
export interface Options {
  // workspace directory, should be absolute
  workspace: string;
  // pipeline metadata
  pipelineMeta: PipelineMeta;
  // framework mirror base url
  mirror: string;
  // cache enabled flag, if true, pipcook find framework in cache first before fetching from remote.
  enableCache: boolean;
  // artifact plugins are installed by npm client, this option is used to specific it.
  npmClient: string;
  // npm registry
  registry?: string;
  // development mode flag, if true, pipcook run all scripts in the original path, without copying them into the workspace, so you can debug them with node-debugger.
  devMode: boolean;
}

/**
 * Runtime for standalone environment,
 * input pipeline configuration file, run the pipeline.
 */
export class StandaloneRuntime {
  // workspace for pipeline
  private workspace: PipelineWorkSpace;
  // script directory
  private scriptDir: string;

  // instance of Costa, the script runner
  private costa: Costa;
  // artiface plugin list
  private artifactPlugins: Plugin.ArtifactMeta[];
  // scripts in the pipeline
  private scripts: ScriptConfig;
  // original pipeline metadata
  private pipelineMeta: PipelineMeta;
  // framework mirror
  private mirror: string;
  // cache enable flag
  private enableCache: boolean;
  // npm client for artifact plugin installation
  private npmClient: string;
  // npm registry for artifact plugin installation
  private registry: string | undefined;
  // development mode flag
  private devMode: boolean;

  /**
   * Standalone runtime constructor.
   * @param opts options to make a standalone runtime.
   */
  constructor(opts: Options) {
    this.pipelineMeta = opts.pipelineMeta;
    this.mirror = opts.mirror;
    this.enableCache = opts.enableCache;
    this.registry = opts.registry;
    this.npmClient = opts.npmClient;
    this.devMode = opts.devMode;

    this.scriptDir = path.join(opts.workspace, constants.WorkspaceScriptDir);
    this.workspace = {
      dataDir: path.join(opts.workspace, constants.WorkspaceDataDir),
      modelDir: path.join(opts.workspace, constants.WorkspaceModelDir),
      cacheDir: path.join(opts.workspace, constants.WorkspaceCacheDir),
      frameworkDir: path.join(opts.workspace, constants.WorkspaceFrameworkDir)
    };
  }

  /**
   * Make directories in workspace, exclude framework, it should be link to the cache.
   */
  private async prepareWorkspace(): Promise<void> {
    const futures = [
      fs.mkdirp(this.workspace.cacheDir),
      fs.mkdirp(this.workspace.dataDir),
      fs.mkdirp(this.workspace.modelDir),
      fs.mkdirp(this.scriptDir)
    ];
    await Promise.all(futures);
  }
  /**
   * Prepare workspace for pipeline running.
   * @param artifactPlugin if prepare artifact plugin, it's necessary for train but not for predict.
   */
  async prepare(artifactPlugin = true): Promise<void> {
    await this.prepareWorkspace();
    logger.info('preparing framework');
    const framework = await Framework.prepareFramework(this.pipelineMeta, this.workspace.frameworkDir, this.mirror, this.enableCache);
    logger.info('preparing scripts');
    this.scripts = await Script.prepareScript(this.pipelineMeta, this.scriptDir, this.enableCache, this.devMode);
    logger.info('preparing artifact plugins');
    if (artifactPlugin) {
      this.artifactPlugins = await Plugin.prepareArtifactPlugin(this.pipelineMeta, this.npmClient, this.registry);
    }
    this.costa = new Costa({
      workspace: this.workspace,
      framework
    });
    logger.info('initializing framework packages');
    await this.costa.initFramework(this.pipelineMeta.options);
    const modulePath = path.join(this.workspace.frameworkDir, constants.JSModuleDirName);
    const scriptModulePath = path.join(this.scriptDir, constants.JSModuleDirName);
    if (await fs.pathExists(modulePath) && !await fs.pathExists(scriptModulePath)) {
      // remove if it exists
      // await fs.remove(scriptModulePath);
      // link node_module in framework to script directory
      await fs.ensureSymlink(modulePath, scriptModulePath, 'junction');
    }
    // link @pipcook/core to node_module
    await Script.linkCoreToScript(scriptModulePath);
  }

  /**
   * Train from pipeline, it shoul be called after `prepare`.
   */
  async train(): Promise<void> {
    logger.info('running data source script');
    let datasource = await this.costa.runDataSource(this.scripts.datasource);
    logger.info('running data flow script');
    if (this.scripts.dataflow) {
      datasource = await this.costa.runDataflow(datasource, this.scripts.dataflow);
    }
    logger.info('running model script');
    const standaloneRT = createStandaloneRT(datasource, this.workspace.modelDir);
    await this.costa.runModel(standaloneRT, this.scripts.model, this.pipelineMeta.options);
    await fs.writeJson(path.join(this.workspace.modelDir, constants.PipelineFileInModelDir), this.pipelineMeta);
    logger.info(`pipeline finished, the model has been saved at ${this.workspace.modelDir}`);
    for (const artifact of this.artifactPlugins) {
      logger.info(`running artifact ${artifact.options.processor}`);
      await artifact.artifactExports.build(this.workspace.modelDir, artifact.options);
      logger.info('done');
    }
  }

  /**
   * Predict from pipeline, it should be called after `prepare`.
   * @param datasource input for predict
   * @returns predict result
   */
  async predict(datasource: DatasetPool.Types.DatasetPool<any, any>): Promise<PredictResult> {
    logger.info('running data flow script');
    if (this.scripts.dataflow) {
      datasource = await this.costa.runDataflow(datasource, this.scripts.dataflow, TaskType.PREDICT);
    }
    logger.info('running model script');
    const standaloneRT = createStandaloneRT(datasource, this.workspace.modelDir);
    return this.costa.runModel(standaloneRT, this.scripts.model, this.pipelineMeta.options, TaskType.PREDICT);
  }
}
