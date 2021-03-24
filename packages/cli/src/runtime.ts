import * as fs from 'fs-extra';
import { PipelineMeta } from '@pipcook/core';
import { Costa, PipelineWorkSpace } from '@pipcook/costa';
import * as path from 'path';
import { createStandaloneRT } from './standalone-impl';
import { logger, Framework, Plugin, Script } from './utils';

/**
 * runtime for standalone environment,
 * input pipeline configuration file, run the pipeline
 */
export class StandaloneRuntime {
  // workspace for pipeline
  private workspace: PipelineWorkSpace;
  // script directory
  private scriptDir: string;

  constructor(
    workspaceDir: string,
    private pipelineMeta: PipelineMeta,
    private enableCache = true
  ) {
    this.scriptDir = path.join(workspaceDir, 'scripts');
    this.workspace = {
      dataDir: path.join(workspaceDir, 'data'),
      modelDir: path.join(workspaceDir, 'model'),
      cacheDir: path.join(workspaceDir, 'cache'),
      frameworkDir: path.join(workspaceDir, 'framework')
    };
  }

  async prepareWorkspace(): Promise<void> {
    const futures = Object.values(this.workspace).map((dir: string) => fs.mkdirp(dir));
    futures.push(fs.mkdirp(this.scriptDir));
    await Promise.all(futures);
  }

  async run(): Promise<void> {
    await this.prepareWorkspace();
    logger.info('preparing framework');
    const framework = await Framework.prepareFramework(this.pipelineMeta, this.workspace.frameworkDir, this.enableCache);
    logger.info('preparing scripts');
    const scripts = await Script.prepareScript(this.pipelineMeta, this.scriptDir, this.enableCache);
    logger.info('preparing artifact plugins');
    const artifactPlugins = await Plugin.prepareArtifactPlugin(this.pipelineMeta);
    const costa = new Costa({
      workspace: this.workspace,
      framework
    });
    logger.info('initializing framework packages');
    await costa.initFramework();
    logger.info('running data source script');
    let dataSource = await costa.runDataSource(scripts.dataSource);
    logger.info('running data flow script');
    if (scripts.dataflow) {
      dataSource = await costa.runDataflow(dataSource, scripts.dataflow);
    }
    logger.info('running model script');
    const standaloneRT = await createStandaloneRT(dataSource, this.pipelineMeta, this.workspace.modelDir);
    await costa.runModel(standaloneRT, scripts.model, this.pipelineMeta.options);
    logger.info(`pipeline finished, the model has been saved at ${this.workspace.modelDir}`);
    for (const artifact of artifactPlugins) {
      logger.info(`running artifact ${artifact.options.processor}`);
      await artifact.artifactExports.build(this.workspace.modelDir, artifact.options);
      logger.info('done');
    }
  }
}
