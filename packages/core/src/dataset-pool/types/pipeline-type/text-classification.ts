import * as DataCook from '@pipcook/datacook';
import { DatasetPool as BaseDatasetPool, ClassificationDatasetMeta } from '..';

import DatasetType = DataCook.Dataset.Types.DatasetType;
import BaseDataset = DataCook.Dataset.Types.Dataset;

export interface Options {
  train?: DataCook.Dataset.Types.TextClassification.TextList;
  test?: DataCook.Dataset.Types.TextClassification.TextList;
  valid?: DataCook.Dataset.Types.TextClassification.TextList;
  predicted?: DataCook.Dataset.Types.TextClassification.TextList;
}

export type Sample = DataCook.Dataset.Types.TextClassification.Sample;

export interface DatasetMeta extends ClassificationDatasetMeta {
  type: DatasetType.Table;
}

export type Dataset = BaseDataset<Sample>;

export type DatasetPool = BaseDatasetPool<Sample, DatasetMeta>;

export interface SinglePredictResult {
  id: number;
  category: string;
  score: number;
}

export type PredictResult = Array<SinglePredictResult>;
