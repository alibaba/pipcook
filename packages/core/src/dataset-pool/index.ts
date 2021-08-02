import * as DataCook from '@pipcook/datacook';
import * as Types from './types';

import Dataset = DataCook.Dataset.Types.Dataset;
import Sample = DataCook.Dataset.Types.Sample;
import ArrayDatasetImpl = DataCook.Dataset.ArrayDatasetImpl;

export * from './pipeline-type';
export * from './format';
export * as Types from './types';

export class ArrayDatasetPoolImpl<T extends Sample, D extends Types.DatasetMeta> implements Types.DatasetPool<T, D> {
  private meta?: D;

  public train?: Dataset<T>;
  public test?: Dataset<T>;
  public valid?: Dataset<T>;
  public predicted?: Dataset<T>;

  static fromArray<DATA extends Sample, META extends Types.DatasetMeta>(datasetData: Types.DatasetData<DATA>, datasetMeta?: META): ArrayDatasetPoolImpl<DATA, META> {
    const obj = new ArrayDatasetPoolImpl<DATA, META>();
    obj.meta = datasetMeta;
    obj.train = datasetData.trainData ? new ArrayDatasetImpl(datasetData.trainData) : undefined;
    obj.test = datasetData.testData ? new ArrayDatasetImpl(datasetData.testData) : undefined;
    obj.valid = datasetData.validData ? new ArrayDatasetImpl(datasetData.validData) : undefined;
    obj.predicted = datasetData.predictedData ? new ArrayDatasetImpl(datasetData.predictedData) : undefined;
    return obj;
  }

  static fromDataset<DATA extends Sample, META extends Types.DatasetMeta>(datasetGrp: Types.DatasetGroup<DATA>, datasetMeta?: META): ArrayDatasetPoolImpl<DATA, META> {
    const obj = new ArrayDatasetPoolImpl<DATA, META>();
    obj.meta = datasetMeta;
    obj.train = datasetGrp.train;
    obj.test = datasetGrp.test;
    obj.valid = datasetGrp.valid;
    obj.predicted = datasetGrp.predicted;
    return obj;
  }

  async getDatasetMeta(): Promise<D | undefined> {
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
  return ArrayDatasetPoolImpl.fromArray(datasetData, datasetMeta);
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
    getDatasetMeta: async () => {
      const meta = await dataset.getDatasetMeta();
      if (!meta) {
        return undefined;
      }
      return metadata(meta);
    },
    train: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}

export function transformSampleInDataset<IN_SAMPLE extends Sample, IN_META extends Types.DatasetMeta = any, OUT_SAMPLE extends Sample = IN_SAMPLE>
(transform: (sample: IN_SAMPLE) => Promise<OUT_SAMPLE>, dataset: Types.DatasetPool<IN_SAMPLE, IN_META>): Types.DatasetPool<OUT_SAMPLE, IN_META> {
  const internalDatasetPool: Types.DatasetPool<OUT_SAMPLE, IN_META> = {
    shuffle: (seed?: string) => dataset.shuffle(seed),
    getDatasetMeta: () => dataset.getDatasetMeta(),
    train: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransform<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}
