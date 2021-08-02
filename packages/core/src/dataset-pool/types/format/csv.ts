import * as DataCook from '@pipcook/datacook';
import { DatasetMeta as BaseDatasetMeta } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;

export interface DatasetMeta extends BaseDatasetMeta {
  type: DatasetType.Table
}
