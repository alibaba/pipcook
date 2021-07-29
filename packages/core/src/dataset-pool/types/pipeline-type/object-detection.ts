import * as DataCook from '@pipcook/datacook';
import { DatasetPool as BaseDatasetPool, DatasetMeta as BaseDatasetMeta } from '../';

import Sample = DataCook.Dataset.Types.ObjectDetection.Sample;
import DatasetType = DataCook.Dataset.Types.DatasetType;
import BaseDataset = DataCook.Dataset.Types.Dataset;

export interface DatasetMeta extends BaseDatasetMeta {
  type: DatasetType.Image,
  labelMap: Record<number, string>;
}

export type Dataset = BaseDataset<Sample>;

export type DatasetPool = BaseDatasetPool<DataCook.Dataset.Types.ObjectDetection.Sample, DatasetMeta>;
