import * as DataCook from '@pipcook/datacook';
import { DatasetData, makeDatasetPool, DatasetPool } from '../dataset-pool';

async function checkCocoMeta(metaObj: Record<string, any>) {
  if (!Array.isArray(metaObj.images)) {
    throw new TypeError('images should be array');
  }
  if (!Array.isArray(metaObj.annotations)) {
    throw new TypeError('annotations should be array');
  }
  metaObj.images.forEach((image) => {
    if (typeof image.id !== 'number') {
      throw new TypeError('invalid id field found in image data');
    }
    if (typeof image.width !== 'number') {
      throw new TypeError('invalid width field found in image data');
    }
    if (typeof image.height !== 'number') {
      throw new TypeError('invalid height field found in image data');
    }
    if (
      typeof image.url !== 'string'
      && typeof image.coco_url !== 'string'
      && typeof image.flickr_url !== 'string'
    ) {
      throw new TypeError('invalid url/flickr_url/coco_url field found in image data');
    }
  });
}

function cocoMetaToDatasetData(
  cocoMeta: DataCook.Dataset.Types.Coco.Meta
): Array<
  DataCook.Dataset.Types.Sample<
    DataCook.Dataset.Types.Coco.Image,
    DataCook.Dataset.Types.Coco.Label
  >
> {
  const annotationMap: Record<number, Array<DataCook.Dataset.Types.Coco.Annotation>> = {};
  for (const ann of cocoMeta.annotations) {
    if (!annotationMap[ann.image_id]) {
      annotationMap[ann.image_id] = [];
    }
    annotationMap[ann.image_id].push(ann);
  }
  return cocoMeta.images.map((img: DataCook.Dataset.Types.Coco.Image) => ({ data: img, label: annotationMap[img.id] }));
}

async function process(
  annotationObj: DataCook.Dataset.Types.Coco.Meta
): Promise<{
  meta: DataCook.Dataset.Types.Coco.Meta,
  datasetData: Array<DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label>>
}> {
  await checkCocoMeta(annotationObj);
  return { meta: annotationObj as DataCook.Dataset.Types.Coco.Meta, datasetData: cocoMetaToDatasetData(annotationObj) };
}

export type Options = {
  trainAnnotationObj: DataCook.Dataset.Types.Coco.Meta;
  testAnnotationObj: DataCook.Dataset.Types.Coco.Meta;
  validAnnotationObj?: DataCook.Dataset.Types.Coco.Meta;
};

export const makeDatasetPoolFromCocoFormat = async (
  options: Options
): Promise<
  DatasetPool<
    DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label>,
    DataCook.Dataset.Types.Coco.DatasetMeta
  >
> => {
  const { meta: trainMeta, datasetData: trainDatasetData } = await process(options.trainAnnotationObj);
  const { datasetData: testDatasetData } = await process(options.testAnnotationObj);
  let validDatasetData = undefined;
  if (options.validAnnotationObj) {
    validDatasetData = (await process(options.validAnnotationObj)).datasetData;
  }
  const data: DatasetData<DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label>> = {
    trainData: trainDatasetData,
    testData: testDatasetData,
    validData: validDatasetData
  };
  const labelMap: Record<number, DataCook.Dataset.Types.Coco.Category> = {};
  (trainMeta as DataCook.Dataset.Types.Coco.Meta).categories.forEach((category: DataCook.Dataset.Types.Coco.Category) => {
    labelMap[category.id] = category;
  });
  const datasetMeta: DataCook.Dataset.Types.Coco.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: {
      train: trainDatasetData.length,
      test: testDatasetData.length,
      valid: Array.isArray(validDatasetData) ? validDatasetData.length : 0
    },
    labelMap,
    info: trainMeta.info,
    licenses: trainMeta.licenses
  };
  return makeDatasetPool(data, datasetMeta);
};
