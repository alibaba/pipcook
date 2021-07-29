import * as DataCook from '@pipcook/datacook';
import * as Types from './types';

import Dataset = DataCook.Dataset.Types.Dataset;
import Sample = DataCook.Dataset.Types.Sample;
import ArrayDatasetImpl = DataCook.Dataset.ArrayDatasetImpl;

export * from './pipeline-type';
export * from './format';
export * as Types from './types';

class ArrayDatasetPoolImpl<T extends Sample, D extends Types.DatasetMeta> implements Types.DatasetPool<T, D> {
  private meta?: D;

  public train?: Dataset<T>;
  public test?: Dataset<T>;
  public valid?: Dataset<T>;
  public predicted?: Dataset<T>;

  constructor(datasetData: Types.DatasetData<T>, datasetMeta?: D) {
    this.meta = datasetMeta;
    this.train = datasetData.trainData ? new ArrayDatasetImpl(datasetData.trainData) : undefined;
    this.test = datasetData.testData ? new ArrayDatasetImpl(datasetData.testData) : undefined;
    this.valid = datasetData.validData ? new ArrayDatasetImpl(datasetData.validData) : undefined;
    this.predicted = datasetData.predictedData ? new ArrayDatasetImpl(datasetData.predictedData) : undefined;
  }

  async getDatasetMeta() {
    return this.meta;
  }

  shuffle(): void {
    this.train?.shuffle();
    this.test?.shuffle();
    this.valid?.shuffle();
    this.predicted?.shuffle();
  }
}

export function makeDatasetPool<T extends Sample, D extends Types.DatasetMeta> (datasetData: Types.DatasetData<T>, datasetMeta?: D): Types.DatasetPool<T, D> {
  return new ArrayDatasetPoolImpl(datasetData, datasetMeta);
}

export function transformDatasetPool<
  IN_SAMPLE extends Sample,
  IN_META extends Types.DatasetMeta,
  OUT_SAMPLE extends Sample = IN_SAMPLE,
  OUT_META extends Types.DatasetMeta = IN_META
>
(transformOption: Types.TransformOption<IN_SAMPLE, IN_META, OUT_SAMPLE, OUT_META>, dataset: Types.DatasetPool<IN_SAMPLE, IN_META>): Types.DatasetPool<OUT_SAMPLE, OUT_META> {
  const { metadata, transform } = transformOption;

  const internalDatasetPool: Types.DatasetPool<OUT_SAMPLE, OUT_META> = {
    shuffle: (seed?: string) => dataset.shuffle(seed),
    getDatasetMeta: async () => metadata(await dataset.getDatasetMeta()),
    train: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}

export function transformSampleInDataset<IN_SAMPLE extends Sample, IN_META extends Types.DatasetMeta = any, OUT_SAMPLE extends Sample = IN_SAMPLE>
(transform: (sample: IN_SAMPLE) => Promise<OUT_SAMPLE>, dataset: Types.DatasetPool<IN_SAMPLE, IN_META>): Types.DatasetPool<OUT_SAMPLE, IN_META> {
  const internalDatasetPool: Types.DatasetPool<OUT_SAMPLE, IN_META> = {
    shuffle: (seed?: string) => dataset.shuffle(seed),
    getDatasetMeta: () => dataset.getDatasetMeta(),
    train: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}
