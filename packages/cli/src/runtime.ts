import * as fs from 'fs-extra';
import { PipelineMeta } from '@pipcook/pipcook-core';
import { Costa } from '@pipcook/costa';
import * as path from 'path';
import { createStandaloneRT } from './standalone-impl';
import { logger, Framework, Plugin, Script } from './utils';

/**
 * runtime for local
 */
export class StandaloneRuntime {

  private scriptDir: string;

  private modelDir: string;

  private cacheDir: string;

  private tmpDir: string;

  private frameworkDir: string;

  constructor(
    workspaceDir: string,
    private pipelineMeta: PipelineMeta,
    private enableCache = true
  ) {
    this.scriptDir = path.join(workspaceDir, 'scripts');
    this.cacheDir = path.join(workspaceDir, 'cache');
    this.modelDir = path.join(workspaceDir, 'model');
    this.tmpDir = path.join(workspaceDir, 'tmp');
    this.frameworkDir = path.join(workspaceDir, 'framework');
  }

  async prepareWorkspace(): Promise<void> {
    await Promise.all([
      fs.mkdirp(this.scriptDir),
      fs.mkdirp(this.tmpDir),
      fs.mkdirp(this.modelDir),
      fs.mkdirp(this.cacheDir)
    ]);
    return;
  }

  async run(): Promise<void> {
    await this.prepareWorkspace();
    logger.info('preparing framework');
    const framework = await Framework.prepareFramework(this.pipelineMeta, this.frameworkDir, this.enableCache);
    logger.info('preparing scripts');
    const scripts = await Script.prepareScript(this.pipelineMeta, this.scriptDir, this.enableCache);
    logger.info('preparing artifact plugins');
    const artifactPlugins = await Plugin.prepareArtifactPlugin(this.pipelineMeta);
    const costa = new Costa({
      workspace: {
        dataDir: this.cacheDir,
        modelDir: this.modelDir,
        cacheDir: this.cacheDir,
        frameworkDir: this.frameworkDir
      },
      framework
    });
    logger.info('initalizing framework packages');
    await costa.initFramework();
    logger.info('running data source script');
    let dataSource = await costa.runDataSource(scripts.dataSource, this.pipelineMeta.options);
    logger.info('running data flow script');
    if (scripts.dataflow) {
      dataSource = await costa.runDataflow(dataSource, scripts.dataflow);
    }
    logger.info('running model script');
    const standaloneRT = createStandaloneRT(dataSource, this.pipelineMeta, this.modelDir);
    await costa.runModel(standaloneRT, scripts.model, this.pipelineMeta.options);
    logger.info(`pipeline finished, the model has been saved at ${this.modelDir}`);
    for (let artifact of artifactPlugins) {
      logger.info(`running artifact ${artifact.options.processor}`);
      await artifact.artifactExports.build(this.modelDir, artifact.options);
      logger.info('done');
    }
  }
}
