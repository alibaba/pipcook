import * as DataCook from '@pipcook/datacook';
import { makeDatasetPool, Types, ArrayDatasetPoolImpl } from '../';

import ImageClassification = DataCook.Dataset.Types.ImageClassification;
import Sample = ImageClassification.Sample;
import DatasetMate = Types.ImageClassification.DatasetMeta;

export const makeImageClassificationDatasetFromList = (opts: Types.ImageClassification.Options): Types.ImageClassification.DatasetPool => {
  const categories: Set<string> = new Set();
  if (opts.train) {
    for (const data of opts.train) {
      categories.add(data.category);
    }
  }
  const meta: Types.ImageClassification.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: {
      train: opts.train ? opts.train.length : 0,
      test: opts.test ? opts.test.length : 0,
      valid: opts.valid ? opts.valid.length : 0,
      predicted: opts.predicted ? opts.predicted.length : 0
    },
    categories: categories.size > 0 ? Array.from(categories) : undefined
  };
  return ArrayDatasetPoolImpl.fromDataset({
    train: opts.train ? DataCook.Dataset.makeClassificationDatasetFromList(opts.train) : undefined,
    test: opts.test ? DataCook.Dataset.makeClassificationDatasetFromList(opts.test) : undefined,
    valid: opts.valid ? DataCook.Dataset.makeClassificationDatasetFromList(opts.valid) : undefined,
    predicted: opts.predicted ? DataCook.Dataset.makeClassificationDatasetFromList(opts.predicted) : undefined
  }, meta);
};


export const makeImageClassificationDataset = (
  datasetData: Types.DatasetData<Sample>,
  meta: DatasetMate
): Types.ImageClassification.DatasetPool => {
  return makeDatasetPool<Sample, DatasetMate>(datasetData, meta);
};
