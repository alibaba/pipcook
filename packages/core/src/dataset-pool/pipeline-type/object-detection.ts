import * as DataCook from '@pipcook/datacook';
import { Coco as CocoDataset, PascalVoc as PascalVocDataset } from '../format';
import { ArrayDatasetPoolImpl, Types } from '../';

import Sample = DataCook.Dataset.Types.Sample;
import Coco = DataCook.Dataset.Types.Coco;
import PascalVoc = DataCook.Dataset.Types.PascalVoc;
import ObjectDetection = DataCook.Dataset.Types.ObjectDetection;

export const makeObjectDetectionDatasetFromCoco = async (options: CocoDataset.Options): Promise<Types.ObjectDetection.DatasetPool> => {
  const dataset = await CocoDataset.makeDatasetPoolFromCocoFormat(options);
  const categoryFiner: Record<number, Coco.Category> = {};
  const categorySet = new Set<string>();
  (await dataset.getDatasetMeta())?.categories?.forEach((item) => {
    categoryFiner[item.id] = item;
    categorySet.add(item.name);
  });
  const categories = Array.from(categorySet);
  return dataset.transform({
    transform: async (sample: Sample<Coco.Image, Coco.Label>): Promise<ObjectDetection.Sample> => {
      const newLabels = sample.label.map((lable) => {
        return {
          name: categoryFiner[lable.category_id].name,
          bbox: lable.bbox
        };
      });
      return {
        data: { uri: sample.data.url || sample.data.coco_url || sample.data.flickr_url },
        label: newLabels
      };
    },
    metadata: async (meta: Types.Coco.DatasetMeta): Promise<Types.ObjectDetection.DatasetMeta> => {
      return {
        type: meta.type,
        size: meta.size,
        categories
      };
    }
  });
};

export const makeObjectDetectionDatasetFromPascalVoc = async (options: PascalVocDataset.Options): Promise<Types.ObjectDetection.DatasetPool> => {
  return (await PascalVocDataset.makeDatasetPoolFromPascalVoc(options)).transform<ObjectDetection.Sample>(
    async (sample: PascalVoc.Sample): Promise<ObjectDetection.Sample> => {
      const newLabels: ObjectDetection.Label = sample.label.map((lable) => {
        return {
          name: lable.name,
          bbox: [
            lable.bndbox.xmin,
            lable.bndbox.ymin,
            lable.bndbox.xmax - lable.bndbox.xmin,
            lable.bndbox.ymax - lable.bndbox.ymin
          ]
        };
      });
      return {
        data: { uri: sample.data.path },
        label: newLabels
      };
    }
  );
};

export const makeObjectDetectionDataset = (
  datasetData: Types.DatasetData<ObjectDetection.Sample>,
  meta: Types.ObjectDetection.DatasetMeta
): Types.ObjectDetection.DatasetPool => {
  return ArrayDatasetPoolImpl.from(datasetData, meta);
};
