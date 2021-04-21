import type * as Datacook from '@pipcook/datacook';

/**
 * The model script can emit the training progress through the API `Runtime.notifyProgress`.
 */
export interface ProgressInfo {
  /**
   * The training progress percentage, it should be [0, 100].
   */
  value: number;
  /**
   * Custom data.
   */
  extendData: Record<string, any>;
}

/**
 * A Runtime is used to run pipelines on a specific platform. The interface `Runtime<T, M>`
 * declares APIs which the runtime implementation must or shall achieve.
 */
export interface Runtime<T extends Datacook.Dataset.Types.Sample<any>, M extends Datacook.Dataset.Types.DatasetMeta> {
  // report progress of pipeline
  notifyProgress: (progress: ProgressInfo) => void;
  // save the model file
  saveModel: (localPathOrStream: string | NodeJS.ReadableStream, filename?: string) => Promise<void>;
  // read model file
  readModel: () => Promise<string>;
  // datasource
  dataset: Datacook.Dataset.Types.Dataset<T, M>;
}

export type FrameworkModule = any;

/**
 * A JavaScript library for feature engineering on datasets,
 * it helps you to cook trainable datus out as its name, datacook.
 * see [here][https://github.com/imgcook/datacook] for more details.
 */
export type DataCookModule = typeof Datacook;

/**
 * The context of script running, includes `boa` and `DataCook`.
 */
export interface ScriptContext {
  /**
   * The boa module, the bridge between node and python.
   */
  boa: FrameworkModule;
  /**
   * DataCook module
   */
  dataCook: DataCookModule;
  /**
   * This function can import a node module from framework. if the module not exists,
   * an error will be thrown.
   */
  importJS: (jsModuleName: string) => Promise<FrameworkModule>;
  /**
   * This function can import a python package from framework. if the module not exists,
   * an error will be thrown.
   */
  importPY: (pyModuleName: string) => Promise<FrameworkModule>;
  /**
   * The workspace for the pipeline. There are some directories to save temporary files.
   */
  workspace: {
    /**
     * Dataset directory, should save the dataset files here.
     */
    dataDir: string;
    /**
     * Cache directory, every sample passed to the model script will be cached into the cache directory,
     * so, the dataflow scripts will not be executed again after the fisrt epoch.
     */
    cacheDir: string;
    /**
     * The model file should be saved here.
     */
    modelDir: string;
  }
}

/**
 * type of data source script entry
 */
export type DataSourceEntry<SAMPLE extends Datacook.Dataset.Types.Sample<any>, META extends Datacook.Dataset.Types.DatasetMeta> =
  (options: Record<string, any>, context: ScriptContext) => Promise<Datacook.Dataset.Types.Dataset<SAMPLE, META>>;

/**
 * type of data flow script entry
 */
export type DataFlowEntry<IN extends Datacook.Dataset.Types.Sample<any>, META extends Datacook.Dataset.Types.DatasetMeta, OUT extends Datacook.Dataset.Types.Sample<any> = IN> =
  (api: Datacook.Dataset.Types.Dataset<IN, META>, options: Record<string, any>, context: ScriptContext) => Promise<Datacook.Dataset.Types.Dataset<OUT, META>>;

/**
 * type of model script entry
 */
export type ModelEntry<SAMPLE extends Datacook.Dataset.Types.Sample<any>, META extends Datacook.Dataset.Types.DatasetMeta> =
  (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<void>;
