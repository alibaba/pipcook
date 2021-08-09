import test from 'ava';
import * as DataCook from '@pipcook/datacook';
import { makeDatasetPoolFromCocoFormat } from './coco';
import { Coco } from '../types';

const annotationObj: DataCook.Dataset.Types.Coco.Meta = {
  images: [
    {
      file_name: 'f984d880-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      width: 750,
      url: 'img/f984d880-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      id: 1,
      height: 286
    },
    {
      file_name: 'fb6a8870-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      width: 750,
      url: 'img/fb6a8870-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      id: 2,
      height: 363
    },
    {
      file_name: 'fd5abfb0-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      width: 750,
      url: 'img/fd5abfb0-1cb6-11ea-a3c0-69b27346a20f-screenshot.png',
      id: 3,
      height: 286
    }
  ],
  annotations: [
    {
      image_id: 1,
      id: 1,
      segmentation: [],
      iscrowd: 0,
      bbox: [
        36,
        36,
        210,
        250
      ],
      category_id: 1
    },
    {
      image_id: 1,
      id: 2,
      segmentation: [],
      iscrowd: 0,
      bbox: [
        270,
        36,
        210,
        250
      ],
      category_id: 1
    },
    {
      image_id: 2,
      id: 3,
      segmentation: [],
      iscrowd: 0,
      bbox: [
        270,
        36,
        210,
        250
      ],
      category_id: 1
    },
    {
      image_id: 2,
      id: 4,
      segmentation: [],
      iscrowd: 0,
      bbox: [
        170,
        36,
        110,
        150
      ],
      category_id: 2
    },
    {
      image_id: 3,
      id: 5,
      segmentation: [],
      iscrowd: 0,
      bbox: [
        150,
        136,
        110,
        50
      ],
      category_id: 1
    }
  ],
  categories: [
    {
      supercategory: 'abovePicture',
      id: 1,
      name: 'abovePicture'
    },
    {
      supercategory: 'button',
      id: 2,
      name: 'button'
    }
  ]
};

const sample1: DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label> = {
  data: annotationObj.images[0],
  label: [ annotationObj.annotations[0], annotationObj.annotations[1] ]
};

const sample2: DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label> = {
  data: annotationObj.images[1],
  label: [ annotationObj.annotations[2], annotationObj.annotations[3] ]
};

const sample3: DataCook.Dataset.Types.Sample<DataCook.Dataset.Types.Coco.Image, DataCook.Dataset.Types.Coco.Label> = {
  data: annotationObj.images[2],
  label: [ annotationObj.annotations[4] ]
};

test('should make a dataset from coco', async (t) => {
  const dataset = await makeDatasetPoolFromCocoFormat({
    trainAnnotationObj: annotationObj,
    testAnnotationObj: annotationObj
  });

  const metadata: Coco.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 0, predicted: 0 },
    categories: [
      { supercategory: 'abovePicture', id: 1, name: 'abovePicture' },
      { supercategory: 'button', id: 2, name: 'button' }
    ],
    info: undefined,
    licenses: undefined
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.train?.nextBatch(1), []);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
});
test('should make a dataset from coco with valid', async (t) => {
  const dataset = await makeDatasetPoolFromCocoFormat({
    trainAnnotationObj: annotationObj,
    testAnnotationObj: annotationObj,
    validAnnotationObj: annotationObj
  });

  const metadata: Coco.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 3, predicted: 0 },
    categories: [
      { supercategory: 'abovePicture', id: 1, name: 'abovePicture' },
      { supercategory: 'button', id: 2, name: 'button' }
    ],
    info: undefined,
    licenses: undefined
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.valid?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
  t.deepEqual(await dataset.valid?.nextBatch(1), [ sample2 ]);
});
