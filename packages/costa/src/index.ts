import {
  Runtime,
  DataSourceEntry,
  ModelEntry,
  DataFlowEntry,
  ScriptContext,
  FrameworkModule,
  Sample,
  DatasetMeta,
  Dataset
} from '@pipcook/core';
import {
  PipcookScript,
  PipcookFramework,
  ScriptType
} from './types';
import * as boa from '@pipcook/boa';
import * as dataCook from '@pipcook/datacook';
import * as path from 'path';
import Debug from 'debug';
import { importFrom } from './utils';
const debug = Debug('costa.runnable');

export * from './types';

export type DefaultRuntime = Runtime<Sample<any>, DatasetMeta>;

export type DefaultDataSource = Dataset<Sample<any>, DatasetMeta>;

export type DefaultDataflowEntry = DataFlowEntry<Sample<any>, DatasetMeta>;

export type DefaultDataSourceEntry = DataSourceEntry<Sample<any>, DatasetMeta>;

export type DefaultModelEntry = ModelEntry<Sample<any>, DatasetMeta>;

export interface PipelineWorkSpace {
  /**
   * the current data directory for this runnable
   */
  dataDir: string;
  /**
   * the temporary directory for model
   */
  modelDir: string;
  /**
   * the cache directory
   */
  cacheDir: string;

  // framework directory
  frameworkDir: string;
}

export interface PipelineRunnerOption {
  workspace: PipelineWorkSpace;
  framework: PipcookFramework;
}

/**
 * The pipeline runner executes the scripts in pipeline
 */
export class Costa {
  /**
   * the framework directroy
   */
  public context: ScriptContext;
  /**
   * Create a runnable by the given runtime.
   */
  constructor(
    public options: PipelineRunnerOption
  ) {}

  /**
   * initialize framework, set python package path, node modules path and construct script context
   */
  async initFramework(): Promise<void> {
    boa.setenv(path.join(this.options.workspace.frameworkDir, this.options.framework.pythonPackagePath || 'site-packages'));
    const nodeModules = path.join(this.options.workspace.frameworkDir, this.options.framework.jsPackagePath || 'node_modules');
    const paths = [ nodeModules, ...(require.resolve.paths(__dirname) || []) ];
    this.context = {
      boa,
      dataCook,
      importJS: (jsModuleName: string): Promise<FrameworkModule> => {
        const module = require.resolve(jsModuleName, { paths });
        return import(module);
      },
      importPY: async (pythonPackageName: string): Promise<FrameworkModule> => {
        return boa.import(pythonPackageName);
      },
      workspace: {
        ...this.options.workspace
      }
    };
  }
  /**
   * make sure the module export is a function
   * @param script script infomation
   * @param moduleExport module export
   */
  async importScript<T>(script: PipcookScript, type: ScriptType): Promise<T> {
    const scriptMoudle = await importFrom(script.path);
    let fn: T = scriptMoudle;
    if (typeof fn !== 'function' && type === ScriptType.DataSource) {
      fn = (fn as any).datasoure;
    }
    if (typeof fn !== 'function' && type === ScriptType.Dataflow) {
      fn = (fn as any).dataflow;
    }
    if (typeof fn !== 'function' && type === ScriptType.Model) {
      fn = (fn as any).model;
    }
    fn = typeof fn === 'function' ? fn : scriptMoudle.default;
    if (typeof fn !== 'function') {
      throw new TypeError(`no export function found in ${script.name}(${script.path})`);
    }
    return fn;
  }

  /**
   * start datasource script.
   * @param script the metadata of script
   * @param options options of the pipeline
   */
  async runDataSource(script: PipcookScript): Promise<DefaultDataSource> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the script(${script.name})`);
    const fn = await this.importScript<DefaultDataSourceEntry>(script, ScriptType.DataSource);
    debug(`loaded the script(${script.name}), start it.`);
    return await fn(script.query, this.context);
  }

  /**
   * start datasource script.
   * @param api api from data source script or another dataflow script
   * @param script the metadata of script
   */
  async runDataflow(api: DefaultDataSource, scripts: Array<PipcookScript>): Promise<DefaultDataSource> {
    for (const script of scripts) {
      debug(`start loading the script(${script.name})`);
      const fn = await this.importScript<DefaultDataflowEntry>(script, ScriptType.Dataflow);
      debug(`loaded the script(${script.name}), start it.`);
      api = await fn(api, script.query, this.context);
    }
    return api;
  }

  /**
   * start datasource script.
   * @param api api from data source script or dataflow script
   * @param script the metadata of script
   * @param options options of the pipeline
   */
  async runModel(api: DefaultRuntime, script: PipcookScript, options: Record<string, any>): Promise<void> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the script(${script.name})`);
    const fn = await this.importScript<DefaultModelEntry>(script, ScriptType.Model);
    // when the `load` is complete, start the plugin.
    debug(`loaded the script(${script.name}), start it.`);
    const opts = {
      ...options.train,
      ...script.query
    };
    return await fn(api, opts, this.context);
  }
}
