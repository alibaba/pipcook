/**
 * @file This plugin is to object detection data from coco format. Make sure that
 * the data is conform to expectation.
 */

import {ArgsType, unZipData, download, createAnnotationFromJson, DataCollectType} from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';

const createDataset = async (type: string, dataDir: string) => {
  const imagePaths = await glob(path.join(dataDir, 'coco', type, '*.+(jpg|jpeg|png)'));
  const countNumber = imagePaths.length;
  console.log('create annotation file...');
  const annotation = fs.readJSONSync(path.join(dataDir, 'coco', type, 'annotation.json'))
  for (let i = 0; i < countNumber; i++) {
    const imagePath = imagePaths[i];
    const imagePathSplit = imagePath.split(path.sep);
    const fileName = imagePathSplit[imagePathSplit.length - 1];
    const cocoImage = annotation.images.find((e: any) => e.file_name == fileName);
    if (!cocoImage) {
      continue;
    }
    const currentAnnotation: any = {
      annotation: {
        folder: [
          path.join(dataDir, type)
        ],
        filename: [
          cocoImage.file_name
        ],
        size: [
          {
            width: [
              cocoImage.width
            ],
            height: [
              cocoImage.height
            ]
          }
        ],
        segmented: [
          0
        ],
     }
    }
    const objects = annotation.annotations.filter((e: any) => e.image_id == cocoImage.id);
    currentAnnotation.annotation.object = objects.map((object: any) => {
      if (!object.category_name) {
        const category = annotation.categories.find((e: any) => e.id == object.category_id).name;
        object.category_name = category;
      }
      return {
        name: [object.category_name],
        pose: ["Unspecified"],
        truncated: ["0"],
        difficult: ["0"],
        bndbox: [
          {
            xmin: [object.bbox[0]],
            ymin: [object.bbox[1]],
            xmax: [object.bbox[0] + object.bbox[2]],
            ymax: [object.bbox[1] + object.bbox[3]]
          }
        ]
      };
    });
    createAnnotationFromJson(path.join(dataDir, type), currentAnnotation);
    fs.moveSync(imagePath, path.join(dataDir, type, fileName));
  }
}

const imageDetectionDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url='',
    dataDir
  } = args;

  assert.ok(url, 'Please specify a url of zip of your dataset');
  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');
  assert.ok(extention[extention.length - 1] === 'zip', 'the file must be zip file')

  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(dataDir, 'temp.zip');
    console.log('downloading dataset ...')
    await download(url, targetPath);
    url = targetPath;
  }

  const saveDir = path.join(dataDir, 'coco');
  console.log('unzip and collecting data...');
  await unZipData(url, saveDir);

  const trainAnnotation = path.join(dataDir, 'coco', 'train', 'annotation.json');
  if (fs.existsSync(trainAnnotation)) {
    await createDataset('train', dataDir);
  }
  if (fs.existsSync(path.join(dataDir, 'coco', 'validation', 'annotation.json'))) {
    await createDataset('validation', dataDir);
  }
  if (fs.existsSync(path.join(dataDir, 'coco', 'test', 'annotation.json'))) {
    await createDataset('test', dataDir);
  }

  try {
    fs.removeSync(saveDir);
    fs.removeSync(url);
  } catch (err) {
    console.log('something is wrong when cleaning temp files');
  }
}

export default imageDetectionDataCollect;