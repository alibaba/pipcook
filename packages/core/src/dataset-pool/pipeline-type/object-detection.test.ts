import test from 'ava';
import { Types } from '../';
import { makeObjectDetectionDatasetFromCoco, makeObjectDetectionDatasetFromPascalVoc } from './object-detection';
import * as DataCook from '@pipcook/datacook';

const cocoAnnotation: DataCook.Dataset.Types.Coco.Meta = {
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

const pascalVocAnnotation: Array<DataCook.Dataset.Types.PascalVoc.Annotation> = [
  {
    annotation: {
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
    }
  },
  {
    annotation: {
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
    }
  },
  {
    annotation: {
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
  }
];

test('should make a dataset from coco', async (t) => {
  const sample1: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: cocoAnnotation.images[0].url },
    label: [
      {
        name: 'abovePicture',
        bbox: cocoAnnotation.annotations[0].bbox
      },
      {
        name: 'abovePicture',
        bbox: cocoAnnotation.annotations[1].bbox
      }
    ]
  };

  const sample2: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: cocoAnnotation.images[1].url },
    label: [
      {
        name: 'abovePicture',
        bbox: cocoAnnotation.annotations[2].bbox
      },
      {
        name: 'button',
        bbox: cocoAnnotation.annotations[3].bbox
      }
    ]
  };

  const sample3: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: cocoAnnotation.images[2].url },
    label: [
      {
        name: 'abovePicture',
        bbox: cocoAnnotation.annotations[4].bbox
      }
    ]
  };

  const dataset = await makeObjectDetectionDatasetFromCoco({
    trainAnnotationObj: cocoAnnotation,
    testAnnotationObj: cocoAnnotation
  });

  const metadata: Types.ObjectDetection.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 0, predicted: 0 },
    categories: [
      'abovePicture',
      'button'
    ]
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.train?.nextBatch(1), []);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
});

test('should make a dataset from pascal', async (t) => {
  const sample1: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: pascalVocAnnotation[0].annotation.path },
    label: [
      {
        name: 'dog',
        bbox: [
          (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.ymin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.xmax - (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.ymax - (pascalVocAnnotation[0].annotation.object as Array<any>)[0].bndbox.ymin
        ]
      },
      {
        name: 'person',
        bbox: [
          (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.ymin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.xmax - (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.ymax - (pascalVocAnnotation[0].annotation.object as Array<any>)[1].bndbox.ymin
        ]
      }
    ]
  };

  const sample2: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: pascalVocAnnotation[1].annotation.path },
    label: [
      {
        name: 'dog',
        bbox: [
          (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.ymin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.xmax - (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.ymax - (pascalVocAnnotation[1].annotation.object as Array<any>)[0].bndbox.ymin
        ]
      },
      {
        name: 'person',
        bbox: [
          (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.ymin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.xmax - (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.ymax - (pascalVocAnnotation[1].annotation.object as Array<any>)[1].bndbox.ymin
        ]
      }
    ]
  };

  const sample3: DataCook.Dataset.Types.ObjectDetection.Sample = {
    data: { uri: pascalVocAnnotation[2].annotation.path },
    label: [
      {
        name: 'dog2',
        bbox: [
          (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.ymin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.xmax - (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.xmin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.ymax - (pascalVocAnnotation[2].annotation.object as Array<any>)[0].bndbox.ymin
        ]
      },
      {
        name: 'person2',
        bbox: [
          (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.ymin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.xmax - (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.xmin,
          (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.ymax - (pascalVocAnnotation[2].annotation.object as Array<any>)[1].bndbox.ymin
        ]
      }
    ]
  };

  const dataset = await makeObjectDetectionDatasetFromPascalVoc({
    trainAnnotationList: pascalVocAnnotation,
    testAnnotationList: pascalVocAnnotation
  });
  const metadata: Types.ObjectDetection.DatasetMeta = {
    type: DataCook.Dataset.Types.DatasetType.Image,
    size: { train: 3, test: 3, valid: 0, predicted: 0 },
    categories: [ 'dog', 'person', 'dog2', 'person2' ]
  };

  t.deepEqual(await dataset.getDatasetMeta(), metadata);
  t.deepEqual(await dataset.train?.next(), sample1);
  t.deepEqual(await dataset.test?.next(), sample1);
  t.deepEqual(await dataset.train?.nextBatch(2), [ sample2, sample3 ]);
  t.deepEqual(await dataset.train?.nextBatch(1), []);
  t.deepEqual(await dataset.test?.nextBatch(1), [ sample2 ]);
});
