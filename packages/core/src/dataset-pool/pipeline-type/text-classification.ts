import * as DataCook from '@pipcook/datacook';
import { Types, ArrayDatasetPoolImpl } from '..';

import TextClassification = DataCook.Dataset.Types.TextClassification;
import Sample = TextClassification.Sample;
import DatasetMate = Types.TextClassification.DatasetMeta;

export const makeTextClassificationDatasetFromList = (opts: Types.TextClassification.Options): Types.TextClassification.DatasetPool => {
  const categories: Set<string> = new Set();
  if (opts.train) {
    for (const data of opts.train) {
      categories.add(data.category);
    }
  }
  const meta: Types.TextClassification.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Table,
    size: {
      train: opts.train ? opts.train.length : 0,
      test: opts.test ? opts.test.length : 0,
      valid: opts.valid ? opts.valid.length : 0,
      predicted: opts.predicted ? opts.predicted.length : 0
    },
    categories: categories.size > 0 ? Array.from(categories) : undefined
  };
  return ArrayDatasetPoolImpl.from({
    train: opts.train ? DataCook.Dataset.makeTextClassificationDatasetFromList(opts.train) : undefined,
    test: opts.test ? DataCook.Dataset.makeTextClassificationDatasetFromList(opts.test) : undefined,
    valid: opts.valid ? DataCook.Dataset.makeTextClassificationDatasetFromList(opts.valid) : undefined,
    predicted: opts.predicted ? DataCook.Dataset.makeTextClassificationDatasetFromList(opts.predicted) : undefined
  }, meta);
};


export const makeTextClassificationDataset = (
  datasetData: Types.DatasetData<Sample>,
  meta: DatasetMate
): Types.TextClassification.DatasetPool => {
  return ArrayDatasetPoolImpl.from(datasetData, meta);
};
