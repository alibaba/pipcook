import * as fs from 'fs-extra';
import { PipelineMeta, Costa, PipelineWorkSpace, ScriptConfig } from '@pipcook/costa';
import { TaskType, PredictResult } from '@pipcook/core';
import * as path from 'path';
import { createStandaloneRT } from './standalone-impl';
import { logger, Framework, Plugin, Script, PredictDataset } from './utils';
import { PipelineType } from '../../costa/dist';

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

  constructor(
    workspaceDir: string,
    private pipelineMeta: PipelineMeta,
    private mirror: string,
    private enableCache: boolean,
    private npmClient: string,
    private registry?: string
  ) {
    this.scriptDir = path.join(workspaceDir, 'scripts');
    this.workspace = {
      dataDir: path.join(workspaceDir, 'data'),
      modelDir: path.join(workspaceDir, 'model'),
      cacheDir: path.join(workspaceDir, 'cache'),
      frameworkDir: path.join(workspaceDir, 'framework')
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
    this.scripts = await Script.prepareScript(this.pipelineMeta, this.scriptDir, this.enableCache);
    logger.info('preparing artifact plugins');
    this.artifactPlugins = await Plugin.prepareArtifactPlugin(this.pipelineMeta, this.npmClient, this.registry);
    this.costa = new Costa({
      workspace: this.workspace,
      framework
    });
    logger.info('initializing framework packages');
    await this.costa.initFramework();
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

  async predict(input: PredictDataset.PredictInput): Promise<PredictResult> {
    switch(this.pipelineMeta.type) {
      case PipelineType.ImageClassification:
      case PipelineType.ObjectDetection:
      case PipelineType.TextClassification:
        break;
      default:
        throw new TypeError(`invalid pipeline type: ${this.pipelineMeta.type}`);
    }
    logger.info('running data source script');
    let datasource = await PredictDataset.makePredictDataset(input, this.pipelineMeta.type);
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
