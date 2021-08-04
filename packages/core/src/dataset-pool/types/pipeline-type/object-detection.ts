import * as DataCook from '@pipcook/datacook';
import { DatasetPool as BaseDatasetPool, ClassificationDatasetMeta } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;
import BaseDataset = DataCook.Dataset.Types.Dataset;

export type Sample = DataCook.Dataset.Types.ObjectDetection.Sample;

export interface DatasetMeta extends ClassificationDatasetMeta {
  type: DatasetType.Image
}

export type Dataset = BaseDataset<Sample>;

export type DatasetPool = BaseDatasetPool<Sample, DatasetMeta>;

export interface PredictObject {
  id: number;
  category: string;
  score: number;
  box: DataCook.Dataset.Types.ObjectDetection.Bbox;
}

export type SinglePredictResult = Array<PredictObject>;

export type PredictResult = Array<SinglePredictResult>;
