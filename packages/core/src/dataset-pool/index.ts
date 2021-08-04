import * as DataCook from '@pipcook/datacook';
import * as Types from './types';

import Dataset = DataCook.Dataset.Types.Dataset;
import Sample = DataCook.Dataset.Types.Sample;
import ArrayDatasetImpl = DataCook.Dataset.ArrayDatasetImpl;

export * from './pipeline-type';
export * from './format';
export * as Types from './types';

function isDatasetData<SAMPLE extends Sample>(arg: Types.DatasetGroup<SAMPLE> | Types.DatasetData<SAMPLE>): arg is Types.DatasetGroup<SAMPLE> {
  return (arg as any).train || (arg as any).test || (arg as any).predicted || (arg as any).valid;
}
function isTransformOption<
  T extends Sample,
  D extends Types.DatasetMeta,
  TARGET_SAMPLE extends Sample,
  TARGET_META extends Types.DatasetMeta
>(arg: Types.TransformOption<T, D, TARGET_SAMPLE, TARGET_META> | ((sample: T) => Promise<TARGET_SAMPLE>)): arg is Types.TransformOption<T, D, TARGET_SAMPLE, TARGET_META> {
  return typeof arg !== 'function';
}

export class ArrayDatasetPoolImpl<T extends Sample, D extends Types.DatasetMeta> implements Types.DatasetPool<T, D> {
  public meta?: D;

  public train?: Dataset<T>;
  public test?: Dataset<T>;
  public valid?: Dataset<T>;
  public predicted?: Dataset<T>;

  static from<SAMPLE extends Sample, META extends Types.DatasetMeta>(datasetGrp: Types.DatasetGroup<SAMPLE>, datasetMeta?: META): ArrayDatasetPoolImpl<SAMPLE, META>;
  static from<SAMPLE extends Sample, META extends Types.DatasetMeta>(datasetData: Types.DatasetData<SAMPLE>, datasetMeta?: META): ArrayDatasetPoolImpl<SAMPLE, META>;
  static from<SAMPLE extends Sample, META extends Types.DatasetMeta>(datasetDataOrGrp: Types.DatasetGroup<SAMPLE> | Types.DatasetData<SAMPLE>, datasetMeta?: META): ArrayDatasetPoolImpl<SAMPLE, META> {
    const obj = new ArrayDatasetPoolImpl<SAMPLE, META>();
    obj.meta = datasetMeta;
    if (isDatasetData(datasetDataOrGrp)) {
      const datasetGrp = datasetDataOrGrp;
      obj.train = datasetGrp.train;
      obj.test = datasetGrp.test;
      obj.valid = datasetGrp.valid;
      obj.predicted = datasetGrp.predicted;
    } else {
      const datasetData = datasetDataOrGrp;
      obj.train = datasetData.trainData ? new ArrayDatasetImpl(datasetData.trainData) : undefined;
      obj.test = datasetData.testData ? new ArrayDatasetImpl(datasetData.testData) : undefined;
      obj.valid = datasetData.validData ? new ArrayDatasetImpl(datasetData.validData) : undefined;
      obj.predicted = datasetData.predictedData ? new ArrayDatasetImpl(datasetData.predictedData) : undefined;
    }
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

  transform<
    TARGET_SAMPLE extends Sample
  > (transformFun: (sample: T) => Promise<TARGET_SAMPLE>): Types.DatasetPool<TARGET_SAMPLE, D>;
  transform<
    TARGET_SAMPLE extends Sample,
    TARGET_META extends Types.DatasetMeta = D
  > (opts: Types.TransformOption<T, D, TARGET_SAMPLE, TARGET_META>): Types.DatasetPool<TARGET_SAMPLE, TARGET_META>;
  transform<
    TARGET_SAMPLE extends Sample,
    TARGET_META extends Types.DatasetMeta = D
  > (optsOrFun: Types.TransformOption<T, D, TARGET_SAMPLE, TARGET_META> | ((sample: T) => Promise<TARGET_SAMPLE>)): Types.DatasetPool<TARGET_SAMPLE, TARGET_META | D> {
    if (isTransformOption(optsOrFun)) {
      const { metadata, transform } = optsOrFun;
      const newDatasetPool = ArrayDatasetPoolImpl.from<TARGET_SAMPLE, TARGET_META>({
        train: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.train, transform),
        test: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.test, transform),
        valid: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.valid, transform),
        predicted: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.predicted, transform)
      });
      const meta = this.meta;
      newDatasetPool.getDatasetMeta = async () => {
        return metadata(meta);
      };
      return newDatasetPool;
    } else {
      return ArrayDatasetPoolImpl.from<TARGET_SAMPLE, D>({
        train: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.train, optsOrFun),
        test: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.test, optsOrFun),
        valid: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.valid, optsOrFun),
        predicted: DataCook.Dataset.makeTransform<T, TARGET_SAMPLE>(this.predicted, optsOrFun)
      }, this.meta);
    }
  }
}
