import {
  Runtime,
  DatasourceEntry,
  ExtModelEntry,
  DataflowEntry,
  ScriptContext,
  FrameworkModule,
  TaskType,
  PredictResult,
  DatasetPool,
  DataCook
} from '@pipcook/core';
import {
  PipcookScript,
  PipcookFramework,
  ScriptType
} from './types';
import * as boa from '@pipcook/boa';
import * as path from 'path';
import Debug from 'debug';
import { importFrom } from './utils';

const debug = Debug('costa.runnable');

export * from './types';

export type DefaultRuntime = Runtime<DataCook.Dataset.Types.Sample<any>, DatasetPool.Types.DatasetMeta>;

export type DefaultDataSet = DatasetPool.Types.DatasetPool<DataCook.Dataset.Types.Sample<any>, DatasetPool.Types.DatasetMeta>;

export type DefaultDataflowEntry = DataflowEntry<DataCook.Dataset.Types.Sample<any>, DatasetPool.Types.DatasetMeta>;

export type DefaultDataSourceEntry = DatasourceEntry<DataCook.Dataset.Types.Sample<any>, DatasetPool.Types.DatasetMeta>;

export type DefaultModelEntry = ExtModelEntry<DataCook.Dataset.Types.Sample<any>, DatasetPool.Types.DatasetMeta>;

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

  /**
   * framework directory
   */
  frameworkDir: string;
}

/**
 * `Costa` constructor options. For `Costa` creation,
 * the runtime should pass the framework information and
 * the specific workspace directory paths.
 */
export interface CostaOption {
  workspace: PipelineWorkSpace;
  framework: PipcookFramework;
}

export interface ScriptEntries {
  datasource: DefaultDataSourceEntry;
  dataflow: Array<DefaultDataflowEntry>;
  model: DefaultModelEntry;
}

/**
 * The pipeline runner who executes the scripts in the pipeline.
 */
export class Costa {
  /**
   * Cache for script entries.
   */
  private entriesCache: Record<string, any> = {};
  /**
   * The context of the pipeline script.
   */
  public context: ScriptContext;

  /**
   * The consturctor of `Costa`.
   */
  constructor(
    /**
     * The options for the `Costa`, includes the framework info and the workspace directory paths.
     */
    public options: CostaOption
  ) {}

  /**
   * initialize framework, set python package path, node modules path and construct script context
   */
  async initFramework(): Promise<void> {
    boa.setenv(path.join(this.options.workspace.frameworkDir, this.options.framework.pythonPackagePath || 'site-packages'));
    const nodeModules = path.join(this.options.workspace.frameworkDir, this.options.framework.jsPackagePath || 'node_modules');

    module.paths.push(nodeModules);
    const paths = [ nodeModules, ...(require.resolve.paths(__dirname) || []) ];
    this.context = {
      boa,
      dataCook: DataCook,
      importJS: (jsModuleName: string): Promise<FrameworkModule> => {
        const module = require.resolve(jsModuleName, { paths });
        return import(module);
      },
      importPY: async (pythonPackageName: string): Promise<FrameworkModule> => {
        return boa.import(pythonPackageName);
      },
      workspace: {
        ...this.options.workspace
      },
      taskType: TaskType.TRAIN
    };
  }

  /**
   * import script and make sure the module export is a function
   * @param script script infomation
   * @param moduleExport module export
   */
  async importScript<T>(script: PipcookScript): Promise<T> {
    const existEntry = this.entriesCache[script.path];
    if (existEntry) {
      return existEntry;
    }
    const scriptExports: any = await importFrom(script.path);
    let entry: any;
    if (typeof scriptExports === 'function') {
      entry = scriptExports;
    } else if (typeof scriptExports.default === 'function') {
      entry = scriptExports.default;
    }
    if (!entry && script.type === ScriptType.DataSource) {
      const { datasource } = scriptExports as any;
      if (typeof datasource === 'function') {
        entry = datasource;
      }
    } else if (!entry && script.type === ScriptType.Dataflow) {
      const { dataflow } = scriptExports as any;
      if (typeof dataflow === 'function') {
        entry = dataflow;
      }
    } else if (script.type === ScriptType.Model) {
      if (entry) {
        entry = {
          train: entry,
          predict: null
        };
      } else {
        const { model } = scriptExports as any;
        const tmpEntry = model ? model : scriptExports;
        if (typeof tmpEntry === 'function') {
          entry = {
            train: tmpEntry,
            predict: null
          };
        } else if (
          typeof tmpEntry === 'object'
          && typeof tmpEntry.train === 'function'
          && typeof tmpEntry.predict === 'function'
        ) {
          entry = tmpEntry;
        }
      }
    }
    if (!entry) {
      throw new TypeError(`no entry found in ${script.name}(${script.path})`);
    }
    this.entriesCache[script.path] = entry;
    return entry;
  }

  /**
   * Run a datasource script.
   * @param script The metadata of script.
   * @param options Options of the pipeline.
   * @returns The datasource API object
   */
  async runDataSource(script: PipcookScript): Promise<DefaultDataSet> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the script(${script.name})`);
    const fn = await this.importScript<DefaultDataSourceEntry>(script);
    debug(`loaded the script(${script.name}), start it.`);
    return await fn(script.query, { ...this.context, taskType: TaskType.TRAIN });
  }

  /**
   * Run a datasource script.
   * @param dataset api from data source script or another dataflow script
   * @param script the metadata of script
   */
  async runDataflow(dataset: DefaultDataSet, scripts: Array<PipcookScript>, taskType = TaskType.TRAIN): Promise<DefaultDataSet> {
    for (const script of scripts) {
      debug(`start loading the script(${script.name})`);
      const fn = await this.importScript<DefaultDataflowEntry>(script);
      debug(`loaded the script(${script.name}), start it.`);
      dataset = await fn(dataset, script.query, { ...this.context, taskType });
    }
    return dataset;
  }

  /**
   * Run a datasource script.
   * @param runtime api from data source script or dataflow script
   * @param script the metadata of script
   * @param options options of the pipeline
   */
  async runModel(runtime: DefaultRuntime, script: PipcookScript, options: Record<string, any>, taskType = TaskType.TRAIN): Promise<void | PredictResult> {
    // log all the requirements are ready to tell the debugger it's going to run.
    debug(`start loading the script(${script.name})`);
    const entry = await this.importScript<DefaultModelEntry>(script);
    // when the `load` is complete, start the plugin.
    debug(`loaded the script(${script.name}), start it.`);
    const opts = {
      ...options.train,
      ...script.query
    };
    if (taskType === TaskType.TRAIN) {
      return entry.train(runtime, opts, { ...this.context, taskType });
    } else {
      if (!entry.predict) {
        throw new TypeError('predict is not supported.');
      }
      return entry.predict(runtime, opts, { ...this.context, taskType });
    }
  }
}
