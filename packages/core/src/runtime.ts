import * as DataCook from '@pipcook/datacook';
import Types = DataCook.Dataset.Types;

/**
 * A sample is the data includes `label` and `data`.
 */
export type Sample<T> = Types.Sample<T>;

/**
 * table column type
 */
export type TableColumnType = Types.TableColumnType;

/**
 * structure of colume description
 */
export type TableColumn = Types.TableColumn;

/**
 * table schema for all columns
 */
export type TableSchema = Types.TableSchema;
/**
 * data source type
 *   * Table: data from db, csv
 *   * Image: image data
 */
export type DatasetType = Types.DatasetType;

/**
 * size of data source
 */
export type DatasetSize = Types.DatasetSize;

export type ImageDimension = Types.ImageDimension;

export type DatasetMeta = Types.DatasetMeta;

/**
 * image data source metadata
 */
export type ImageDatasetMeta = Types.ImageDatasetMeta;
/**
 * table data source metadata
 */
export type TableDatasetMeta = Types.TableDatasetMeta;
export type DataAccessor<T> = Types.DataAccessor<T>;

/**
 * data source api
 */
export type Dataset<T extends Sample<any>, D extends DatasetMeta> = Types.Dataset<T, D>;

/**
 * progress infomation
 */
export interface ProgressInfo {
  // progress percentage, 0 - 100
  progressValue: number;
  // custom data
  extendData: Record<string, any>;
}

/**
 * runtime api
 */
export interface Runtime<T extends Sample<any>, M extends DatasetMeta> {
  // report progress of pipeline
  notifyProgress: (progress: ProgressInfo) => void;
  // save the model file
  saveModel: (localPathOrStream: string | NodeJS.ReadableStream, filename: string) => Promise<void>;
  // read model file
  readModel: () => Promise<string>;
  // datasource
  dataSource: Dataset<T, M>;
}

export type FrameworkModule = any;
export type DataCookModule = typeof DataCook;

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
export type DataSourceEntry<SAMPLE extends Sample<any>, META extends DatasetMeta> =
  (options: Record<string, any>, context: ScriptContext) => Promise<Dataset<SAMPLE, META>>;

/**
 * type of data flow script entry
 */
export type DataFlowEntry<IN extends Sample<any>, META extends DatasetMeta, OUT extends Sample<any> = IN> =
  (api: Dataset<IN, META>, options: Record<string, any>, context: ScriptContext) => Promise<Dataset<OUT, META>>;

/**
 * type of model script entry
 */
export type ModelEntry<SAMPLE extends Sample<any>, META extends DatasetMeta> =
  (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<void>;
