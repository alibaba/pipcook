import { PipelineMeta } from './pipeline';
import * as DataCook from '@pipcook/datacook';
import Types = DataCook.Dataset.Types;

export type DefaultType = Types.DefaultType;

export type Sample<T = DefaultType> = Types.Sample<T>;

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
 *   Table: data from db, csv
 *   Image: image data
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
export type Dataset<T extends Sample, D extends DatasetMeta> = Types.Dataset<T, D>;

/**
 * current task type
 *   All: run all scripts
 *   Data: run data source and data flow script
 *   Model: run model script
 */
export enum TaskType {
  All,
  Data,
  Model,
  Unknown
}

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
export interface Runtime<T extends Sample, M extends DatasetMeta> {
  // get pipeline metadata
  pipelineMeta: () => Promise<PipelineMeta>;
  // get current task type
  taskType: () => TaskType | undefined;
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

export interface ScriptContext {
  // boa module
  boa: FrameworkModule;
  // DataCook module
  dataCook: DataCookModule;
  // import javascript module
  importJS: (jsModuleName: string) => Promise<FrameworkModule>;
  // import python package
  importPY: (pyModuleName: string) => Promise<FrameworkModule>;
  // volume workspace
  workspace: {
    // dataset directory
    dataDir: string;
    // cache directory
    cacheDir: string;
    // model directory
    modelDir: string;
  }
}

/**
 * type of data source script entry
 */
export type DataSourceEntry<SAMPLE extends Sample, META extends DatasetMeta> =
  (options: Record<string, any>, context: ScriptContext) => Promise<Dataset<SAMPLE, META>>;

/**
 * type of data flow script entry
 */
export type DataFlowEntry<IN extends Sample, META extends DatasetMeta, OUT extends Sample = IN> =
  (api: Dataset<IN, META>, options: Record<string, any>, context: ScriptContext) => Promise<Dataset<OUT, META>>;

/**
 * type of model script entry
 */
export type ModelEntry<SAMPLE extends Sample, META extends DatasetMeta> =
  (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<void>;
