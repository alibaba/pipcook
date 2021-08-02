import * as DataCook from '@pipcook/datacook';
import { DatasetSize, DatasetMeta as BaseDatasetMeta } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;
import Category = DataCook.Dataset.Types.Coco.Category;
import Info = DataCook.Dataset.Types.Coco.Info;
import License = DataCook.Dataset.Types.Coco.License;

export interface DatasetMeta extends BaseDatasetMeta {
  type: DatasetType.Image,
  size: DatasetSize,
  categories?: Array<Category>,
  info?: Info;
  licenses?: Array<License>;
}
