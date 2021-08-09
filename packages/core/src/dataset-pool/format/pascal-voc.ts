import * as DataCook from '@pipcook/datacook';
import { ArrayDatasetPoolImpl, Types } from '../';
import DatasetType = DataCook.Dataset.Types.DatasetType;
import PascalVoc = DataCook.Dataset.Types.PascalVoc;

export interface Options {
  trainAnnotationList?: Array<PascalVoc.Annotation>;
  testAnnotationList?: Array<PascalVoc.Annotation>;
  validAnnotationList?: Array<PascalVoc.Annotation>;
  predictedAnnotationList?: Array<PascalVoc.Annotation>;
}

export const makeDatasetPoolFromPascalVoc = async (options: Options): Promise<Types.DatasetPool<PascalVoc.Sample, Types.PascalVoc.DatasetMeta>> => {
  const train = options.trainAnnotationList ? DataCook.Dataset.makeDatasetFromPascalVoc(options.trainAnnotationList) : undefined;
  const test = options.testAnnotationList ? DataCook.Dataset.makeDatasetFromPascalVoc(options.testAnnotationList) : undefined;
  const valid = options.validAnnotationList ? DataCook.Dataset.makeDatasetFromPascalVoc(options.validAnnotationList) : undefined;
  const predicted = options.predictedAnnotationList ? DataCook.Dataset.makeDatasetFromPascalVoc(options.predictedAnnotationList) : undefined;
  const categories: Array<string> = options.trainAnnotationList ? DataCook.Dataset.extractCategoriesFromPascalVoc(options.trainAnnotationList) : [];

  const datasetMeta: Types.PascalVoc.DatasetMeta = {
    type: DatasetType.Image,
    size: {
      train: (await train?.nextBatch(-1))?.length || 0,
      test: (await test?.nextBatch(-1))?.length || 0,
      valid: (await valid?.nextBatch(-1))?.length || 0,
      predicted: (await predicted?.nextBatch(-1))?.length || 0
    },
    categories
  };
  await Promise.all([
    train?.seek(0),
    test?.seek(0),
    valid?.seek(0),
    predicted?.seek(0)
  ]);
  return ArrayDatasetPoolImpl.from({
    train,
    test,
    valid,
    predicted
  }, datasetMeta);
};
