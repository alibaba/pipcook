import * as DataCook from '@pipcook/datacook';
import { Types } from './dataset-pool';

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
export interface Runtime<T extends DataCook.Dataset.Types.Sample<any>, M extends Types.DatasetMeta> {
  // report progress of pipeline
  notifyProgress: (progress: ProgressInfo) => void;
  // save the model file
  saveModel: (localPathOrStream: string | NodeJS.ReadableStream, filename?: string) => Promise<void>;
  // read model file
  readModel: () => Promise<string>;
  // datasource
  dataset: Types.DatasetPool<T, M>;
}

export type FrameworkModule = any;

/**
 * There ara 2 kinds of pipeline task type, `TaskType.TRAIN` means running for model training,
 * `TaskType.PREDICT` means running for predicting.
 */
export enum TaskType { TRAIN = 1, PREDICT = 2 }

/**
 * The context of script running.
 */
export interface ScriptContext {
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

    /**
     * framework directory
     */
    frameworkDir: string;
  },
  taskType: TaskType;
}

export type PredictResult = Types.ObjectDetection.PredictResult | Types.TextClassification.PredictResult | Types.ImageClassification.PredictResult | any;

/**
 * type of data source script entry
 */
export type DatasourceEntry<SAMPLE extends DataCook.Dataset.Types.Sample<any>, META extends Types.DatasetMeta> =
  (options: Record<string, any>, context: ScriptContext) => Promise<Types.DatasetPool<SAMPLE, META>>;

/**
 * type of data flow script entry
 */
export type DataflowEntry<
  IN extends DataCook.Dataset.Types.Sample<any>,
  IN_META extends Types.DatasetMeta,
  OUT extends DataCook.Dataset.Types.Sample<any> = IN,
  OUT_META extends Types.DatasetMeta = IN_META
> =
  (api: Types.DatasetPool<IN, IN_META>, options: Record<string, any>, context: ScriptContext) => Promise<Types.DatasetPool<OUT, OUT_META>>;

/**
 * type of model script entry for train
 */
export type ModelEntry<SAMPLE extends DataCook.Dataset.Types.Sample<any>, META extends Types.DatasetMeta> =
  (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<void>;

/**
 * type of model script entry for predict
 */
export type PredictEntry<SAMPLE extends DataCook.Dataset.Types.Sample<any>, META extends Types.DatasetMeta> =
  (api: Runtime<SAMPLE, META>, options: Record<string, any>, context: ScriptContext) => Promise<PredictResult>;

/**
 * type of model script entry for train and predict
 */
export interface ExtModelEntry<SAMPLE extends DataCook.Dataset.Types.Sample<any>, META extends Types.DatasetMeta> {
  train: ModelEntry<SAMPLE, META>;
  predict: PredictEntry<SAMPLE, META>;
}
