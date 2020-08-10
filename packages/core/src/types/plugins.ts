import { UniDataset, Sample, Metadata } from './data/common';
import { UniModel } from './model';
import { EvaluateResult } from './other';

interface InsertParams {
  jobId: string;
  modelDir: string;
  dataDir: string;
}

export type PluginTypeI = 'dataCollect' | 'dataAccess' | 'dataProcess' | 'datasetProcess' | 'modelLoad' | 'modelDefine' | 'modelTrain' | 'modelEvaluate';

/**
 * The base type which represents the `Record` from pipeline config file.
 */
export type ArgsType = InsertParams & Record<string, any>

/**
 * The `ArgsType`-based object to be used for defining a model.
 */
export interface ModelDefineArgsType extends ArgsType {
  /**
   * The model directory to recover the model.
   */
  recoverPath: string;
}

/**
 * The `ArgsType`-based object to be used for training a model.
 */
export interface ModelTrainArgsType extends ArgsType {
  /**
   * The pathname to save the model.
   */
  modelPath: string;
}

/**
 * Each Pipcook Plugin is inherited from this interface, which inputs any params,
 * and outputs an Promise of PipcookComponentOutput.
 */
export interface PipcookPlugin {
  (...args: any[]): Promise<any>;
}

/**
 * The data collect plugin is designed to help users collect various data and store
 * the data in a standardized way for subsequent plugins in the pipeline.
 *
 * The sources of data can be various, such as files and folders in various local
 * formats, files downloaded from the internet, and data queried from database. At
 * the same time:
 *
 * - it should also support dividing data into different datasets and clearly revealing
 *   the data format.
 * - it should accurately output information about the data itself, such as the name of
 *   each feature, the type of the feature, the number of samples, and all relevant meta
 *   information of the data.
 *
 * @example
 *
 * ```js
 * const collectTextline: DataCollectType = async (args: ArgsType): Promise<void> => {
 *   const { uri, dataDir } = args;
 *   await fs.copy(uri, dataDir + '/my-own-dataset.csv');
 *   return null;
 * };
 * export default collectTextline;
 * ```
 *
 * @param args it does not force input parameters. In principle, the plugin can obtain data
 *        from any sources and channels, and is divided into datasets and test sets according to
 *        certain principles. We recommend that you specify the data source type (for example,
 *        local file storage or download from the network) to help you configure the data more
 *        clearly.
 * @returns The plugin should store the data locally.
 */
export interface DataCollectType extends PipcookPlugin {
  (args: ArgsType): Promise<void>;
}

/**
 * This plugin is a data access plugin, designed to connect datasets from different sources to
 * Pipcook. At the same time, you could perform certain data verification in this plugin to ensure
 * the quality of data access.
 *
 * Based on the returned value of `DataAccessType`, this plugin could selectively calculate and
 * verify data related to Datasets.
 *
 * For example, for image data, we can calculate the average value, variance, and eigenvector of
 * images, therefore, the quality of the data set is evaluated and output.
 *
 * At the same time, data access will connect the data to the memory, and the output might be
 * `tf.dataset` or other data loader.
 *
 * @param args accepts the result from `DataCollectType`.
 * @returns a unified dataset.
 */
export interface DataAccessType extends PipcookPlugin {
  (args: ArgsType): Promise<UniDataset>;
}

/**
 * After the `DataAccessType` plugin unifies the data format and outputs the current training data,
 * the `DataProcessType` Performs unified pre-processing operations before the data enters the model,
 * including data cleaning, data transformation, and data standardization.
 *
 * Theoretically, you can use this kind of plugin to process your data in any form, including changes
 * to data features.
 *
 * @example
 *
 * ```js
 * const doubleSize: DataProcessType = async (sample: Sample, metadata: Metadata, args?: ArgsType): Promise<void> => {
 *   // double the data
 *   sample.data = sample.data * 2;
 * };
 * export default doubleSize;
 * ```
 *
 * @param data The row data of which you access to the `UniDataset` instance.
 * @param metadata The metadata of which you access to the `UniDataset` instance.
 * @param args The arguments from pipeline config file.
 */
export interface DataProcessType extends PipcookPlugin {
  (data: Sample, metadata: Metadata, args: ArgsType): Promise<Sample>;
}

/**
 * Similar to `DataProcessType`, but this type targets on the whole dataset rather than a sample.
 * This plugin will be convenient when it comes to process data that requires information from the whole dataset. I.E. corpus construction, average data among the dataset ...
 *
 * @example
 *
 * ```js
 * const getCorpus = async (dataset: UniDataset, metadata: Metadata, args?: ArgsType): Promise<void> => {
 *  const corpus: Set<string> = new Set();
 *  for (const data of dataset) {
 *    for (const word of (data.data.split(" "))) {
 *      corpus.add(word);
 *    }
 *  }
 *  metadata.corpus = corpus;
 * }
 * ```
 *
 * @param dataset The dataset of which you loaded in `dataCollect` & `dataAccess`
 * @param args The arguments from pipeline config file.
 */
export interface DatasetProcessType extends PipcookPlugin {
  (dataset: UniDataset, args: ArgsType): Promise<void>;
}

/**
 * Similar to `DataProcessType`, but this type targets on the whole dataset rather than a sample.
 * This plugin will be convenient when it comes to process data that requires information from the whole dataset. I.E. corpus construction, average data among the dataset ...
 *
 * @example
 *
 * ```js
 * const getCorpus = async (dataset: UniDataset, metadata: Metadata, args?: ArgsType): Promise<void> => {
 *  const corpus: Set<string> = new Set();
 *  for (const data of dataset) {
 *    for (const word of (data.data.split(" "))) {
 *      corpus.add(word);
 *    }
 *  }
 *  metadata.corpus = corpus;
 * }
 * ```
 *
 * @param dataset The dataset of which you loaded in `dataCollect` & `dataAccess`
 * @param args The arguments from pipeline config file.
 */
export interface DatasetProcessType extends PipcookPlugin {
  (dataset: UniDataset, args: ArgsType): Promise<void>;
}

/**
 * This plugin is used to load a trained model to pipeline.
 */
export interface ModelLoadType extends PipcookPlugin {
  (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>;
}

/**
 * The `ModelDefineType` plugin is used to define model. Because of the differences
 * between JavaScript and Python, tfjs uses json files to store model data, while
 * `tensorflow-python` uses protobuf(Tensorflow SavedModel, Frozen Model, etc.).
 *
 * It's worth noting that `ModelDefineType` should allow loading from models previously
 * trained by Pipcook.
 *
 * @param data The `UniDataset` to be trained, in this plugin, you could fetch some metadata.
 * @param args The useful arguments to define model.
 * @returns an `UniModel` instance.
 */
export interface ModelDefineType extends PipcookPlugin {
  (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>;
}

/**
 * The `ModelTrainType` plugin is used to train the model. This interface provides the ability
 * to configure basic parameters of the training model, but these parameters should not be
 * required, allows plugin developers to define the appropriate hyper-parameters within the plugin.
 *
 * @param data The `UniDataset` to be trained.
 * @param model The `UniModel` which is defined by a `ModelDefineType` plugin.
 * @param args The useful arguments to train the model.
 * @returns an `UniModel` instance which should be trained.
 */
export interface ModelTrainType extends PipcookPlugin {
  (data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>;
}

/**
 * The `ModelEvaluateType` plugin deeply analyzes the training results of the model to help you
 * understand how the model performs on the testing set.
 *
 * @param data The `UniDataset` to be trained.
 * @param model The `UniModel` which is trained by a `ModelTrainType` plugin.
 * @param args The useful arguments to evaluate the model.
 * @returns an `EvaluateResult` to view the evaluation result.
 */
export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult>;
}
