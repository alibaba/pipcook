import * as DataCook from '@pipcook/datacook';
import { Coco as CocoDataset, PascalVoc as PascalVocDataset } from '../format';
import { transformDatasetPool, makeDatasetPool, Types } from '../';

import Sample = DataCook.Dataset.Types.Sample;
import Coco = DataCook.Dataset.Types.Coco;
import PascalVoc = DataCook.Dataset.Types.PascalVoc;
import ObjectDetection = DataCook.Dataset.Types.ObjectDetection;

export const makeObjectDetectionDatasetFromCoco = async (options: CocoDataset.Options): Promise<Types.ObjectDetection.DatasetPool> => {
  const dataset = await CocoDataset.makeDatasetPoolFromCocoFormat(options);
  return transformDatasetPool<Sample<Coco.Image, Coco.Label>, Types.Coco.DatasetMeta, ObjectDetection.Sample, Types.ObjectDetection.DatasetMeta>({
    transform: async (sample: Sample<Coco.Image, Coco.Label>): Promise<ObjectDetection.Sample> => {
      const newLabels = sample.label.map((lable) => {
        return {
          id: lable.id,
          bbox: lable.bbox
        };
      });
      return {
        data: { uri: sample.data.url || sample.data.coco_url || sample.data.flickr_url },
        label: newLabels
      };
    },
    metadata: async (meta: Types.Coco.DatasetMeta): Promise<Types.ObjectDetection.DatasetMeta> => {
      const labelMap: Record<number, string> = {};
      for (const labelId in meta.labelMap) {
        labelMap[labelId] = meta.labelMap[labelId].name;
      }
      return {
        type: meta.type,
        size: meta.size,
        labelMap
      };
    }
  }, dataset);
};

export const makeObjectDetectionDatasetFromPascalVoc = async (options: PascalVocDataset.Options): Promise<Types.ObjectDetection.DatasetPool> => {
  const dataset = await PascalVocDataset.makeDatasetFromPascalVocFormat(options);
  return transformDatasetPool<
      Sample<PascalVoc.ExtAnnotation, Array<PascalVoc.ExtPascalVocObject>>,
      Types.PascalVoc.DatasetMeta,
      ObjectDetection.Sample,
      Types.ObjectDetection.DatasetMeta
    >({
      transform: async (sample: Sample<PascalVoc.ExtAnnotation, Array<PascalVoc.ExtPascalVocObject>>)
        : Promise<ObjectDetection.Sample> => {
        const newLabels: ObjectDetection.Label = sample.label.map((lable) => {
          return {
            id: lable.id,
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
      metadata: async (meta: Types.PascalVoc.DatasetMeta): Promise<Types.ObjectDetection.DatasetMeta> => {
        const labelMap: Record<number, string> = {};
        for (const labelId in meta.labelMap) {
          labelMap[labelId] = meta.labelMap[labelId];
        }
        return {
          type: meta.type,
          size: meta.size,
          labelMap
        };
      }
    }, dataset);
};

export const makeObjectDetectionDataset = async (
  datasetData: Types.DatasetData<ObjectDetection.Sample>,
  meta: Types.ObjectDetection.DatasetMeta
): Promise<Types.ObjectDetection.DatasetPool> => {
  return makeDatasetPool<ObjectDetection.Sample, Types.ObjectDetection.DatasetMeta>(datasetData, meta);
};
