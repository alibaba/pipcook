import * as fs from 'fs-extra';
import { PipelineMeta, Costa, PipelineWorkSpace, ScriptConfig } from '@pipcook/costa';
import { TaskType, PredictResult } from '@pipcook/core';
import * as path from 'path';
import { createStandaloneRT } from './standalone-impl';
import { logger, Framework, Plugin, Script, PredictDataset } from './utils';
import { JSModuleDirName } from './constants';

export interface Options {
  workspace: string;
  pipelineMeta: PipelineMeta;
  mirror: string;
  enableCache: boolean;
  npmClient: string;
  registry?: string;
  devMode: boolean;
}

/**
 * runtime for standalone environment,
 * input pipeline configuration file, run the pipeline
 */
export class StandaloneRuntime {
  // workspace for pipeline
  private workspace: PipelineWorkSpace;
  // script directory
  private scriptDir: string;

  private costa: Costa;

  private artifactPlugins: Plugin.ArtifactMeta[];

  private scripts: ScriptConfig;

  private pipelineMeta: PipelineMeta;
  private mirror: string;
  private enableCache: boolean;
  private npmClient: string;
  private registry: string | undefined;
  private devMode: boolean;

  constructor(opts: Options) {
    this.pipelineMeta = opts.pipelineMeta;
    this.mirror = opts.mirror;
    this.enableCache = opts.enableCache;
    this.registry = opts.registry;
    this.npmClient = opts.npmClient;
    this.devMode = opts.devMode;

    this.scriptDir = path.join(opts.workspace, 'scripts');
    this.workspace = {
      dataDir: path.join(opts.workspace, 'data'),
      modelDir: path.join(opts.workspace, 'model'),
      cacheDir: path.join(opts.workspace, 'cache'),
      frameworkDir: path.join(opts.workspace, 'framework')
    };
  }

  private async prepareWorkspace(): Promise<void> {
    const futures = Object.values(this.workspace).map((dir: string) => fs.mkdirp(dir));
    futures.push(fs.mkdirp(this.scriptDir));
    await Promise.all(futures);
  }
  async prepare(): Promise<void> {
    await this.prepareWorkspace();
    logger.info('preparing framework');
    const framework = await Framework.prepareFramework(this.pipelineMeta, this.workspace.frameworkDir, this.mirror, this.enableCache);
    logger.info('preparing scripts');
    this.scripts = await Script.prepareScript(this.pipelineMeta, this.scriptDir, this.enableCache, this.devMode);
    logger.info('preparing artifact plugins');
    this.artifactPlugins = await Plugin.prepareArtifactPlugin(this.pipelineMeta, this.npmClient, this.registry);
    this.costa = new Costa({
      workspace: this.workspace,
      framework
    });
    logger.info('initializing framework packages');
    await this.costa.initFramework();
    const modulePath = path.join(this.workspace.frameworkDir, JSModuleDirName);
    const scriptModulePath = path.join(this.scriptDir, JSModuleDirName);
    if (await fs.pathExists(modulePath) && !await fs.pathExists(scriptModulePath)) {
      // link node_module in framework to script directory
      await fs.symlink(modulePath, scriptModulePath);
      // link @pipcook/core to node_module
      await Script.linkCoreToScript(scriptModulePath);
    }
  }

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
    logger.info(`pipeline finished, the model has been saved at ${this.workspace.modelDir}`);
    for (const artifact of this.artifactPlugins) {
      logger.info(`running artifact ${artifact.options.processor}`);
      await artifact.artifactExports.build(this.workspace.modelDir, artifact.options);
      logger.info('done');
    }
  }

  async predict(inputs: Array<PredictDataset.PredictInput>): Promise<PredictResult> {
    logger.info('running data source script');
    let datasource = await PredictDataset.makePredictDataset(inputs, this.pipelineMeta.type);
    if (!datasource) {
      throw new TypeError(`invalid pipeline type: ${this.pipelineMeta.type}`);
    }
    logger.info('running data flow script');
    if (this.scripts.dataflow) {
      datasource = await this.costa.runDataflow(datasource, this.scripts.dataflow, TaskType.PREDICT);
    }
    logger.info('running model script');
    const standaloneRT = createStandaloneRT(datasource, this.workspace.modelDir);
    const predictResult = await this.costa.runModel(standaloneRT, this.scripts.model, this.pipelineMeta.options, TaskType.PREDICT);
    console.log('predict result:', JSON.stringify(predictResult));
    return predictResult;
  }
}
