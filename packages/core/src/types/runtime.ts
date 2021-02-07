// sample
export interface Sample<T> {
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

export type TableColumn = { name: string, type: TableColumnType };

// table schema for all columns
export type TableSchema = Array<TableColumn>;

export enum DataSourceType { Table, Image }
export interface DataSourceSize {
  train: number;
  test: number;
}

export interface ImageDimension {
  x: number,
  y: number,
  z: number
}

export type ImageDataSourceMeta = {
  type: DataSourceType;
  size: DataSourceSize;
  dimension: ImageDimension;
};

export type TableDataSourceMeta = {
  type: DataSourceType;
  size: DataSourceSize;
  tableSchema: TableSchema;
  dataKeys: Array<string> | null;
  labelMap: Map<number, string>;
};


interface BaseArtifact {
  type: string;
}

export interface LocalArtfact extends BaseArtifact {
  path: string;
}

export interface PipelineMeta {
  specVersion: string;
  dataSource: string;
  dataflow: Array<string> | null;
  model: string;
  artifacts: Array<LocalArtfact>;
  options: Record<string, any>;
}

export enum ScriptType { DataSource, Dataflow, Model }

export interface PipcookScript {
  name: string;
  path: string;
  type: ScriptType;
}

export enum FrameworkType { 'python', 'js' }

export const FrameworkDescFileName = 'framework.json';
export interface PipcookFramework {
  path: string;
  name: string;
  version: string;
  type: FrameworkType;
}

export interface ScriptConfig {
  dataSource: PipcookScript | null;
  dataflow: Array<PipcookScript> | null;
  model: PipcookScript;
}

export interface DataAccessor<T> {
  next: () => Promise<Sample<T> | null>;
  nextBatch: (batchSize: number) => Promise<Array<Sample<T>> | null>;
  seek: (pos: number) => Promise<void>;
}

export interface DataSourceApi<T> {
  getDataSourceMeta: () => Promise<TableDataSourceMeta | ImageDataSourceMeta>;
  test: DataAccessor<T>;
  train: DataAccessor<T>;
  evaluate?: DataAccessor<T>;
}

export interface Runtime<T> {
  getPipelineMeta: () => Promise<PipelineMeta>;
  getTaskType: () => TaskType | undefined;
  saveModel: (localPath: string) => Promise<void>;
  readModel: () => Promise<string>;
  dataSource: DataSourceApi<T>;
}
