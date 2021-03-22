import { PipelineMeta } from './pipeline';
import * as DataCook from '@pipcook/datacook';
export type DefaultType = any;

// sample
export interface Sample<T = DefaultType> {
  label: number;
  data: T;
}

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
 * table column type
 */
export enum TableColumnType {
  Number,
  String,
  Bool,
  Map,
  Datetime,
  Unknown
}

/**
 * structure of colume description
 */
export interface TableColumn {
  name: string,
  type: TableColumnType
}

/**
 * table schema for all columns
 */
export type TableSchema = Array<TableColumn>;

/**
 * data source type
 *   Table: data from db, csv
 *   Image: image data
 */
export enum DataSourceType { Table, Image }

/**
 * size of data source
 */
export interface DataSourceSize {
  train: number;
  test: number;
  evaluate?: number;
}

export interface ImageDimension {
  x: number,
  y: number,
  z: number
}

/**
 * image data source metadata
 */
export interface ImageDataSourceMeta {
  type: DataSourceType;
  size: DataSourceSize;
  dimension: ImageDimension;
  labelMap: Record<number, string>;
}

/**
 * table data source metadata
 */
export interface TableDataSourceMeta {
  type: DataSourceType;
  size: DataSourceSize;
  tableSchema: TableSchema;
  dataKeys: Array<string> | null;
  labelMap: Record<number, string>;
}

export type DataSourceMeta = TableDataSourceMeta | ImageDataSourceMeta;
export interface SequentialDataAccessor<T = DefaultType> {
  next: () => Promise<Sample<T> | null>;
  nextBatch: (batchSize: number) => Promise<Array<Sample<T>> | null>;
  seek: (pos: number) => Promise<void>;
}
export interface DataAccessor<T = DefaultType> extends SequentialDataAccessor {
  init: (size: number) => void;
  nextRandom: () => Promise<Sample<T> | null>;
  nextBatchRandom: (batchSize: number) => Promise<Array<Sample<T>> | null>;
  resetRandom: (randomSeed?: string) => Promise<Array<number>>;
}

/**
 * data source api
 */
export interface SequentialDataSourceApi<T = DefaultType> {
  // fetch data source metadata
  getDataSourceMeta: () => Promise<DataSourceMeta>;
  // test dataset accessor
  test: SequentialDataAccessor<T>;
  // train dataset accessor
  train: SequentialDataAccessor<T>;
  // evaluate dataset accessor, qoptional
  evaluate?: SequentialDataAccessor<T>;
}

export interface DataSourceApi<T = DefaultType> {
  getDataSourceMeta: () => Promise<DataSourceMeta>;
  test: DataAccessor<T>;
  train: DataAccessor<T>;
  evaluate?: DataAccessor<T>;
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
export interface Runtime<T = DefaultType> {
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
  dataSource: SequentialDataSourceApi<T>;
}

export type FrameworkModule = any;
export type DataCookModule = typeof DataCook;
export type DataCookImage = DataCook.Image;
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
export type DataSourceEntry<T> = (options: Record<string, any>, context: ScriptContext) => Promise<SequentialDataSourceApi<T>>;

/**
 * type of data flow script entry
 */
export type DataFlowEntry<IN, OUT = IN> = (api: SequentialDataSourceApi<IN>, options: Record<string, any>, context: ScriptContext) => Promise<SequentialDataSourceApi<OUT>>;

/**
 * type of model script entry
 */
export type ModelEntry<T> = (api: Runtime<T>, options: Record<string, any>, context: ScriptContext) => Promise<void>;
