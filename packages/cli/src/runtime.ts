import * as fs from 'fs-extra';
import {
  PipelineMeta,
  ScriptConfig,
  ScriptType,
  PipcookScript,
  download,
  downloadAndExtractTo,
  PipcookFramework,
  FrameworkDescFileName
} from '@pipcook/pipcook-core';
import { PipelineRunner } from '@pipcook/costa';
import * as path from 'path';
import { URL } from 'url';
import createAdapter from './standalone-impl';
import { logger } from './utils';

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
    private pipelineConfig: PipelineMeta
  ) {
    this.scriptDir = path.join(workspaceDir, 'scripts');
    this.cacheDir = path.join(workspaceDir, 'cache');
    this.modelDir = path.join(workspaceDir, 'model');
    this.tmpDir = path.join(workspaceDir, 'tmp');
    this.frameworkDir = path.join(workspaceDir, 'framework');
  }

  async downloadScript(scriptOrder: number, url: string, type: ScriptType): Promise<PipcookScript> {
    const urlObj = new URL(url);
    const baseName = path.parse(urlObj.pathname).base;
    const localPath = path.join(this.scriptDir, `${scriptOrder}-${baseName}`);
    await download(url, localPath);
    return {
      name: baseName,
      path: localPath,
      type
    };
  }

  async prepareScript(): Promise<ScriptConfig> {
    const scripts: ScriptConfig = {
      dataSource: null,
      dataflow: null,
      model: null
    };
    let scriptOrder = 0;
    scripts.dataSource = await this.downloadScript(scriptOrder, this.pipelineConfig.dataSource, ScriptType.DataSource);
    scriptOrder++;
    if (this.pipelineConfig.dataflow) {
      scripts.dataflow = [];
      for (let dataflowUri of this.pipelineConfig.dataflow) {
        scripts.dataflow.push(await this.downloadScript(scriptOrder, dataflowUri, ScriptType.Dataflow));
        scriptOrder++;
      }
    }
    scripts.model = await this.downloadScript(scriptOrder, this.pipelineConfig.model, ScriptType.Model);
    return scripts;
  }

  async prepareWorkSpace(): Promise<void> {
    await Promise.all([
      fs.mkdirp(this.scriptDir),
      fs.mkdirp(this.tmpDir),
      fs.mkdirp(this.modelDir),
      fs.mkdirp(this.cacheDir),
      fs.mkdirp(this.frameworkDir)
    ]);
    return;
  }

  async run(): Promise<void> {
    await this.prepareWorkSpace();
    logger.info('preparing framework');
    const framework = await this.prepareFramework();
    logger.info('prepare framework successfully, prepare scripts');
    const scripts = await this.prepareScript();
    logger.info('prepare scripts successfully, ready to run pipeline');
    const runner = new PipelineRunner({
      workingDir: this.tmpDir,
      dataDir: this.cacheDir,
      modelDir: this.modelDir,
      frameworkDir: this.frameworkDir,
      framework
    });
    logger.info('initalizing framework');
    await runner.initFramework();
    logger.info('framework initalized, running data source script');
    let dataAPI = await runner.runDataSource(scripts.dataSource, this.pipelineConfig.options);
    logger.info('running data flow script');
    if (scripts.dataflow) {
      dataAPI = await runner.runDataflow(scripts.dataflow, this.pipelineConfig.options, dataAPI);
    }
    logger.info('running model script');
    const adapter = createAdapter(this.pipelineConfig, dataAPI);
    runner.runModel(scripts.model, this.pipelineConfig.options, adapter);
    logger.info('pipeline finished');
  }

  async prepareFramework(): Promise<PipcookFramework> {
    if (this.pipelineConfig.options.framework) {
      await downloadAndExtractTo(this.pipelineConfig.options.framework, this.frameworkDir);
      const framework = await fs.readJson(path.join(this.frameworkDir, FrameworkDescFileName));
      // todo: validate framework
      return {
        pythonPackagePath: framework.pythonPackagePath,
        name: framework.name,
        version: framework.version,
        desc: framework.desc,
        path: this.frameworkDir,
        packages: framework.packages
      };
    }
  }
}
