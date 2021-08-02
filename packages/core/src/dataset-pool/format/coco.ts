import * as DataCook from '@pipcook/datacook';
import { Types as DatasetTypes, ArrayDatasetPoolImpl } from '..';

export type Options = {
  trainAnnotationObj?: DataCook.Dataset.Types.Coco.Meta;
  testAnnotationObj?: DataCook.Dataset.Types.Coco.Meta;
  validAnnotationObj?: DataCook.Dataset.Types.Coco.Meta;
  predictedAnnotationObj?: DataCook.Dataset.Types.Coco.Meta;
};

export const makeDatasetPoolFromCocoFormat = async (
  options: Options
): Promise<
  DatasetTypes.DatasetPool<
    DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label>,
    DatasetTypes.Coco.DatasetMeta
  >
> => {
  const train = options.trainAnnotationObj ? DataCook.Dataset.makeDatasetFromCoco(options.trainAnnotationObj) : undefined;
  const test = options.testAnnotationObj ? DataCook.Dataset.makeDatasetFromCoco(options.testAnnotationObj) : undefined;
  const valid = options.validAnnotationObj ? DataCook.Dataset.makeDatasetFromCoco(options.validAnnotationObj) : undefined;
  const predicted = options.predictedAnnotationObj ? DataCook.Dataset.makeDatasetFromCoco(options.predictedAnnotationObj) : undefined;

  const categories = options.trainAnnotationObj ? DataCook.Dataset.extractCategoriesFromCoco(options.trainAnnotationObj) : undefined;

  const datasetMeta: DatasetTypes.Coco.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: {
      train: (await train?.nextBatch(-1))?.length || 0,
      test: (await test?.nextBatch(-1))?.length || 0,
      valid: (await valid?.nextBatch(-1))?.length || 0,
      predicted: (await predicted?.nextBatch(-1))?.length || 0
    },
    categories,
    info: options.trainAnnotationObj?.info,
    licenses: options.trainAnnotationObj?.licenses
  };
  await Promise.all([
    train?.seek(0),
    test?.seek(0),
    valid?.seek(0),
    predicted?.seek(0)
  ]);
  return ArrayDatasetPoolImpl.fromDataset({
    train,
    test,
    valid,
    predicted
  }, datasetMeta);
};
