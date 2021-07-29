import * as DataCook from '@pipcook/datacook';
import { DatasetSize } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;
import Category = DataCook.Dataset.Types.Coco.Category;
import Info = DataCook.Dataset.Types.Coco.Info;
import License = DataCook.Dataset.Types.Coco.License;

export type DatasetMeta = {
  type: DatasetType.Image,
  size: DatasetSize,
  labelMap: Record<number, Category>,
  info?: Info;
  licenses?: Array<License>;
}
