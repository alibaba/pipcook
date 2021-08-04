import * as DataCook from '@pipcook/datacook';

import Dataset = DataCook.Dataset.Types.Dataset;
import Sample = DataCook.Dataset.Types.Sample;
import DatasetType = DataCook.Dataset.Types.DatasetType;
import ImageDimension = DataCook.Dataset.Types.ImageDimension;
import TableSchema = DataCook.Dataset.Types.TableSchema;

export * from './format';
export * from './pipeline-type';

/**
 * size of data source
 */
export interface DatasetSize {
  train: number;
  test: number;
  valid: number;
  predicted: number;
}

/**
 * data source api
 */
export interface DatasetPool<T extends Sample, D extends DatasetMeta> {
  getDatasetMeta: () => Promise<D | undefined>;
  test?: Dataset<T>;
  train?: Dataset<T>;
  valid?: Dataset<T>;
  predicted?: Dataset<T>;
  shuffle: (seed?: string) => void;
}

export interface TransformOption<
  IN_SAMPLE extends Sample,
  IN_META extends DatasetMeta,
  OUT_SAMPLE extends Sample = IN_SAMPLE,
  OUT_META extends DatasetMeta = IN_META
> {
  transform: (sample: IN_SAMPLE) => Promise<OUT_SAMPLE>,
  metadata: (meta?: IN_META) => Promise<OUT_META>
}

export interface DatasetData<T extends Sample> {
  trainData?: Array<T>,
  testData?: Array<T>,
  validData?: Array<T>,
  predictedData?: Array<T>
}

export interface DatasetMeta {
  type: DatasetType;
  size?: DatasetSize;
}

export interface ClassificationDatasetMeta extends DatasetMeta {
  categories?: Array<string>;
}

export interface ObjectDetectionDatasetMeta extends DatasetMeta {
  categories?: Array<any>;
}

/**
 * image data source metadata
 */
export interface ImageDatasetMeta extends DatasetMeta {
  dimension: ImageDimension;
}

/**
 * table data source metadata
 */
export interface TableDatasetMeta extends DatasetMeta {
  tableSchema: TableSchema;
  dataKeys: Array<string> | null;
}

export interface DatasetGroup<T extends Sample> {
  train?: Dataset<T>,
  test?: Dataset<T>,
  valid?: Dataset<T>,
  predicted?: Dataset<T>
}
