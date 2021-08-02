import * as DataCook from '@pipcook/datacook';
import { Coco as CocoDataset, PascalVoc as PascalVocDataset } from '../format';
import { transformDatasetPool, transformSampleInDataset, makeDatasetPool, Types } from '../';

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
  return transformDatasetPool<Sample<Coco.Image, Coco.Label>, Types.Coco.DatasetMeta, ObjectDetection.Sample, Types.ObjectDetection.DatasetMeta>({
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
  }, dataset);
};

export const makeObjectDetectionDatasetFromPascalVoc = async (options: PascalVocDataset.Options): Promise<Types.ObjectDetection.DatasetPool> => {
  const dataset = await PascalVocDataset.makeDatasetPoolFromPascalVoc(options);

  return transformSampleInDataset<PascalVoc.Sample,
      Types.PascalVoc.DatasetMeta,
      ObjectDetection.Sample
    >(
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
      },
      dataset
    );
};

export const makeObjectDetectionDataset = async (
  datasetData: Types.DatasetData<ObjectDetection.Sample>,
  meta: Types.ObjectDetection.DatasetMeta
): Promise<Types.ObjectDetection.DatasetPool> => {
  return makeDatasetPool<ObjectDetection.Sample, Types.ObjectDetection.DatasetMeta>(datasetData, meta);
};
