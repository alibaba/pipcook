import {
  Runtime,
  PipcookScript,
  DataSourceApi,
  PipcookFramework,
  PackageType,
  DataSourceEntry,
  ModelEntry,
  DataFlowEntry,
  ScriptContext,
  FrameworkModule
} from '@pipcook/pipcook-core';
import * as boa from '@pipcook/boa';
import * as path from 'path';
import Debug from 'debug';
const debug = Debug('costa.runnable');

export interface PipelineRunnerOption {
  workspace: {
    /**
     * the current working directory for this runnable.
     */
    workingDir: string;
    /**
     * the current data directory for this runnable
     */
    dataDir: string;
    modelDir: string;
    frameworkDir: string;
  };
  framework: PipcookFramework;
}

/**
 * The pipeline runner executes the scripts in pipeline
 */
export class PipelineRunner {
  /**
   * the framework directroy
   */
  private context: ScriptContext;
  /**
   * Create a runnable by the given runtime.
   */
  constructor(
    public options: PipelineRunnerOption
  ) {}

  async initFramework(): Promise<void> {
    const python: Record<string, FrameworkModule> = {};
    const js: Record<string, FrameworkModule> = {};
    if (this.options.framework.pythonPackagePath) {
      boa.setenv(path.join(this.options.workspace.frameworkDir, this.options.framework.pythonPackagePath));
    }
    if (Array.isArray(this.options.framework.packages)) {
      for (let pkg of this.options.framework.packages) {
        if (pkg.type === PackageType.Python) {
          python[pkg.name] = boa.import(pkg.name);
        } else {
          js[pkg.name] = await import(pkg.importPath);
        }
      }
    }
    this.context = {
      boa,
      // or put dataCook into js framework modules?
      dataCook: null,
      framework: {
        python,
        js
      }
    };
  }
  /**
   * start datasource script.
   * @param script the metadata of script
   * @param options options of the pipeline
   */
  async runDataSource(script: PipcookScript, options: Record<string, any>): Promise<DataSourceApi<any>> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the plugin(${script})`);
    const scriptMoudle = await import(script.path);
    const fn: DataSourceEntry = typeof scriptMoudle === 'function' ? scriptMoudle : scriptMoudle.default;
    if (typeof fn !== 'function') {
      throw new TypeError(`no export function found in ${script.name}(${script.path})`);
    }
    debug(`loaded the plugin(${script.name}), start it.`);
    const opts = { ...options, dataDir: this.options.workspace.dataDir };
    return await fn(opts, this.context);
  }

  /**
   * start datasource script.
   * @param script the metadata of script
   * @param options options of the pipeline
   * @param api api from data source script or another dataflow script
   */
  async runDataflow(scripts: Array<PipcookScript>, options: Record<string, any>, api: DataSourceApi<any>): Promise<DataSourceApi<any>> {
    for (let script of scripts) {
      debug(`start loading the plugin(${script})`);
      const scriptMoudle = await import(script.path);
      const fn: DataFlowEntry = typeof scriptMoudle === 'function' ? scriptMoudle : scriptMoudle.default;
      if (typeof fn !== 'function') {
        throw new TypeError(`no export function found in ${script.name}(${script.path})`);
      }
      debug(`loaded the plugin(${script.name}), start it.`);
      api = await fn(api, options, this.context);
    }
    return api;
  }

  /**
   * start datasource script.
   * @param script the metadata of script
   * @param options options of the pipeline
   * @param api api from data source script or dataflow script
   */
  async runModel(script: PipcookScript, options: Record<string, any>, api: Runtime<any>): Promise<void> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the plugin(${script})`);
    const scriptMoudle = await import(script.path);
    const fn: ModelEntry = typeof scriptMoudle === 'function' ? scriptMoudle : scriptMoudle.default;
    if (typeof fn !== 'function') {
      throw new TypeError(`no export function found in ${script.name}(${script.path})`);
    }
    // when the `load` is complete, start the plugin.
    debug(`loaded the plugin(${script.name}), start it.`);
    const opts = {
      ...options,
      modelPath: this.options.workspace.modelDir
    };
    return await fn(api, opts, this.context);
  }
}
