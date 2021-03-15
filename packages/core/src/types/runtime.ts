import { PipelineMeta } from './pipeline';

export type DefaultType = any;

// sample
export interface Sample<T = DefaultType> {
  label: number;
  data: T;
}

// task type
export enum TaskType {
  ModelDefine,
  ModelTrain,
  ModelEvaluate,
  Unknown
}

// table column type
export enum TableColumnType {
  Number,
  String,
  Bool,
  Map,
  Datetime,
  Unknown
}

export interface TableColumn { name: string, type: TableColumnType }

// table schema for all columns
export type TableSchema = Array<TableColumn>;

export enum DataSourceType { Table, Image }
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

export interface ImageDataSourceMeta {
  type: DataSourceType;
  size: DataSourceSize;
  dimension: ImageDimension;
}

export interface TableDataSourceMeta {
  type: DataSourceType;
  size: DataSourceSize;
  tableSchema: TableSchema;
  dataKeys: Array<string> | null;
  labelMap: Map<number, string>;
}

export type DataSourceMeta = TableDataSourceMeta | ImageDataSourceMeta;
export interface DataAccessor<T = DefaultType> {
  next: () => Promise<Sample<T> | null>;
  nextBatch: (batchSize: number) => Promise<Array<Sample<T>> | null>;
  seek: (pos: number) => Promise<void>;
}

export interface DataSourceApi<T = DefaultType> {
  getDataSourceMeta: () => Promise<DataSourceMeta>;
  test: DataAccessor<T>;
  train: DataAccessor<T>;
  evaluate?: DataAccessor<T>;
}

export interface ProgressInfo {
  progressValue: number;
}

export interface Runtime<T = DefaultType> {
  pipelineMeta: () => Promise<PipelineMeta>;
  taskType: () => TaskType | undefined;
  notifyProgress: (progress: ProgressInfo) => void;
  saveModel: (localPathOrStream: string | NodeJS.ReadableStream, filename: string) => Promise<void>;
  readModel: () => Promise<string>;
  dataSource: DataSourceApi<T>;
}

export type FrameworkModule = any;

export interface ScriptContext {
  // todo: type of boa
  boa: FrameworkModule;
  // todo: type of dataCook
  dataCook: FrameworkModule;
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
export type DataSourceEntry<T> = (options: Record<string, any>, context: ScriptContext) => Promise<DataSourceApi<T>>;

/**
 * type of data flow script entry
 */
export type DataFlowEntry<T> = (api: DataSourceApi<T>, options: Record<string, any>, context: ScriptContext) => Promise<DataSourceApi<T>>;

/**
 * type of model script entry
 */
export type ModelEntry<T> = (api: Runtime<T>, options: Record<string, any>, context: ScriptContext) => Promise<void>;
