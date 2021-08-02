import * as DataCook from '@pipcook/datacook';
import { ClassificationDatasetMeta } from '../';

import DatasetType = DataCook.Dataset.Types.DatasetType;

export interface DatasetMeta extends ClassificationDatasetMeta {
  type: DatasetType.Image
}
