import {
  Runtime,
  PipcookScript,
  DataSourceApi,
  PipcookFramework,
  FrameworkType,
  DataSourceEntry,
  ModelEntry,
  DataFlowEntry,
  ScriptContext,
  FrameworkModule
} from '@pipcook/pipcook-core';
import Debug from 'debug';
import * as boa from '@pipcook/boa';
const debug = Debug('costa.runnable');
/**
 * This represents requirements for Python and its packages.
 */
export interface CondaConfig {
  /**
   * The Python dependency, but it's solid to 3.7 for now.
   */
  python?: string;
  /**
   * The Python third-party dependencies.
   */
  dependencies?: Record<string, string>;
}

/**
 * The arguments for calling `bootstrap`.
 */
export interface BootstrapArg {
  /**
   * Add extra environment variables.
   */
  customEnv?: Record<string, string>;
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
   * the current working directory for this runnable.
   */
  public workingDir: string;

  /**
   * the current data directory for this runnable
   */
  public dataDir: string;

  public modelDir: string;

  /**
   * Create a runnable by the given runtime.
   */
  constructor(workingDir: string, dataDir: string, modelDir: string, framework: PipcookFramework) {
    this.workingDir = workingDir;
    this.dataDir = dataDir;
    // todo: save model through runtime api
    this.modelDir = modelDir;
    const python: Record<string, FrameworkModule> = {};
    const js: Record<string, FrameworkModule> = {};
    if (framework.type === FrameworkType.Python) {
      process.env.PYTHONPATH = framework.path;
      python[framework.name] = boa.import(framework.path);
    } else {
      js[framework.name] = require(framework.path);
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
    const scriptMoudle = require(script.path);
    const fn: DataSourceEntry = typeof scriptMoudle === 'function' ? scriptMoudle : scriptMoudle.default;
    if (typeof fn !== 'function') {
      throw new TypeError(`no export function found in ${script.name}(${script.path})`);
    }
    debug(`loaded the plugin(${script.name}), start it.`);
    const opts = { ...options, dataDir: this.dataDir };
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
      const scriptMoudle = require(script.path);
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
    const scriptMoudle = require(script.path);
    const fn: ModelEntry = typeof scriptMoudle === 'function' ? scriptMoudle : scriptMoudle.default;
    if (typeof fn !== 'function') {
      throw new TypeError(`no export function found in ${script.name}(${script.path})`);
    }
    // when the `load` is complete, start the plugin.
    debug(`loaded the plugin(${script.name}), start it.`);
    const opts = {
      ...options,
      modelPath: this.modelDir
    };
    return await fn(api, opts, this.context);
  }
}
