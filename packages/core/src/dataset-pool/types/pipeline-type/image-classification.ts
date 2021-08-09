import * as DataCook from '@pipcook/datacook';
import { DatasetPool as BaseDatasetPool, ClassificationDatasetMeta } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;
import BaseDataset = DataCook.Dataset.Types.Dataset;

export interface Options {
  train?: DataCook.Dataset.Types.ImageClassification.ImageList;
  test?: DataCook.Dataset.Types.ImageClassification.ImageList;
  valid?: DataCook.Dataset.Types.ImageClassification.ImageList;
  predicted?: DataCook.Dataset.Types.ImageClassification.ImageList;
}

export type Sample = DataCook.Dataset.Types.ImageClassification.Sample;

export interface DatasetMeta extends ClassificationDatasetMeta {
  type: DatasetType.Image;
}

export type Dataset = BaseDataset<Sample>;

export type DatasetPool = BaseDatasetPool<Sample, DatasetMeta>;

export interface SinglePredictResult {
  id: number;
  category: string;
  score: number;
}

export type PredictResult = Array<SinglePredictResult>;
