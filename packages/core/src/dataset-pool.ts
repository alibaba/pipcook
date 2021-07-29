import * as DataCook from "@pipcook/datacook";
import Sample = DataCook.Dataset.Types.Sample;
import ArrayDatasetImpl = DataCook.Dataset.ArrayDatasetImpl;
import Dataset = DataCook.Dataset.Types.Dataset;
import DatasetMeta = DataCook.Dataset.Types.DatasetMeta;

export interface DatasetData<T extends Sample> {
  trainData?: Array<T>,
  testData?: Array<T>,
  validData?: Array<T>,
  predictedData?: Array<T>
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

class DatasetPoolImpl<T extends Sample, D extends DatasetMeta> implements DatasetPool<T, D> {
  private meta?: D;

  public train?: Dataset<T>;
  public test?: Dataset<T>;
  public valid?: Dataset<T>;
  public predicted?: Dataset<T>;

  constructor(datasetData: DatasetData<T>, datasetMeta?: D) {
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

export function makeDatasetPool<T extends Sample, D extends DatasetMeta> (datasetData: DatasetData<T>, datasetMeta?: D): DatasetPool<T, D> {
  return new DatasetPoolImpl(datasetData, datasetMeta);
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

export function transformDatasetPool<
  IN_SAMPLE extends Sample,
  IN_META extends DatasetMeta,
  OUT_SAMPLE extends Sample = IN_SAMPLE,
  OUT_META extends DatasetMeta = IN_META
>
(transformOption: TransformOption<IN_SAMPLE, IN_META, OUT_SAMPLE, OUT_META>, dataset: DatasetPool<IN_SAMPLE, IN_META>): DatasetPool<OUT_SAMPLE, OUT_META> {
  const { metadata, transform } = transformOption;

  const internalDatasetPool: DatasetPool<OUT_SAMPLE, OUT_META> = {
    shuffle: (seed?: string) => dataset.shuffle(seed),
    getDatasetMeta: async () => metadata(await dataset.getDatasetMeta()),
    train: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}

export function transformSampleInDataset<IN_SAMPLE extends Sample, IN_META extends DatasetMeta = any, OUT_SAMPLE extends Sample = IN_SAMPLE>
(transform: (sample: IN_SAMPLE) => Promise<OUT_SAMPLE>, dataset: DatasetPool<IN_SAMPLE, IN_META>): DatasetPool<OUT_SAMPLE, IN_META> {
  const internalDatasetPool: DatasetPool<OUT_SAMPLE, IN_META> = {
    shuffle: (seed?: string) => dataset.shuffle(seed),
    getDatasetMeta: () => dataset.getDatasetMeta(),
    train: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.train, transform),
    test: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.test, transform),
    valid: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.valid, transform),
    predicted: DataCook.Dataset.makeTransformDataset<IN_SAMPLE, OUT_SAMPLE>(dataset.predicted, transform)
  };

  return internalDatasetPool;
}
