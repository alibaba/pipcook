import test from 'ava';
import { Types } from '../';
import { makeDatasetFromPascalVocFormat } from './pascal-voc';
import * as DataCook from '@pipcook/datacook';

import Sample = DataCook.Dataset.Types.PascalVoc.Sample;

const pascalVocAnnotation: Array<DataCook.Dataset.Types.PascalVoc.Annotation> = [
  {
    folder: 'images',
    filename: '0001.jpg',
    path: 'images/0001.jpg',
    source: {
      database: 'database',
      annotation: 'source.annotation',
      image: 'source.image',
      flickrid: '123'
    },
    owner: {
      flickrid: 'owner.flickerid',
      name: 'owner.name'
    },
    size: {
      width: 234,
      height: 345,
      depth: 3
    },
    segmented: 0,
    object: [
      {
        // id: 0,
        name: 'dog',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 48,
          ymin: 240,
          xmax: 195,
          ymax: 371
        }
      },
      {
        // id: 1,
        name: 'person',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 8,
          ymin: 12,
          xmax: 352,
          ymax: 498
        }
      }
    ]
  },
  {
    folder: 'images',
    filename: '0002.jpg',
    path: 'images/0002.jpg',
    source: {
      database: 'database',
      annotation: 'source.annotation',
      image: 'source.image',
      flickrid: '123'
    },
    owner: {
      flickrid: 'owner.flickerid',
      name: 'owner.name'
    },
    size: {
      width: 234,
      height: 345,
      depth: 3
    },
    segmented: 0,
    object: [
      {
        // id: 0,
        name: 'dog',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 48,
          ymin: 240,
          xmax: 195,
          ymax: 371
        }
      },
      {
        // id: 1,
        name: 'person',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 8,
          ymin: 12,
          xmax: 352,
          ymax: 498
        }
      }
    ]
  },
  {
    folder: 'images',
    filename: '0003.jpg',
    path: 'images/0003.jpg',
    source: {
      database: 'database',
      annotation: 'source.annotation',
      image: 'source.image',
      flickrid: '123'
    },
    owner: {
      flickrid: 'owner.flickerid',
      name: 'owner.name'
    },
    size: {
      width: 235,
      height: 346,
      depth: 3
    },
    segmented: 0,
    object: [
      {
        // id: 2,
        name: 'dog2',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 48,
          ymin: 240,
          xmax: 195,
          ymax: 371
        }
      },
      {
        // id: 3,
        name: 'person2',
        pose: 'Left',
        truncated: 1,
        difficult: 0,
        bndbox: {
          xmin: 8,
          ymin: 12,
          xmax: 352,
          ymax: 498
        }
      }
    ]
  }
];

const sample1: Sample = {
  data: {
    ...pascalVocAnnotation[0], object: [
      { ...pascalVocAnnotation[0].object[0], id: 0 }, { ...pascalVocAnnotation[0].object[1], id: 1 }
    ]
  },
  label: [
    { ...pascalVocAnnotation[0].object[0], id: 0 }, { ...pascalVocAnnotation[0].object[1], id: 1 }
  ]
};

const sample2: Sample = {
  data: {
    ...pascalVocAnnotation[1], object: [
      { ...pascalVocAnnotation[1].object[0], id: 0 }, { ...pascalVocAnnotation[1].object[1], id: 1 }
    ]
  },
  label: [ { ...pascalVocAnnotation[1].object[0], id: 0 }, { ...pascalVocAnnotation[1].object[1], id: 1 } ]
};

const sample3: Sample = {
  data: {
    ...pascalVocAnnotation[2], object: [
      { ...pascalVocAnnotation[2].object[0], id: 2 }, { ...pascalVocAnnotation[2].object[1], id: 3 }
    ]
  },
  label: [ { ...pascalVocAnnotation[2].object[0], id: 2 }, { ...pascalVocAnnotation[2].object[1], id: 3 } ]
};

test('should make a dataset from pascalvoc', async (t) => {
  const dataset = await makeDatasetFromPascalVocFormat({
    trainAnnotationList: pascalVocAnnotation,
    testAnnotationList: pascalVocAnnotation
  });

  const metadata: Types.PascalVoc.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 0, predicted: 0 },
    labelMap: [ 'dog', 'person', 'dog2', 'person2' ]
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.train?.nextBatch(1), []);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
});
test('should make a dataset from pascalvoc with valid', async (t) => {
  const dataset = await makeDatasetFromPascalVocFormat({
    trainAnnotationList: pascalVocAnnotation,
    testAnnotationList: pascalVocAnnotation,
    validAnnotationList: pascalVocAnnotation
  });

  const metadata: Types.PascalVoc.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 3, predicted: 0 },
    labelMap: [ 'dog', 'person', 'dog2', 'person2' ]
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.valid?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
  t.deepEqual(await dataset.valid?.nextBatch(1), [ sample2 ]);
});
