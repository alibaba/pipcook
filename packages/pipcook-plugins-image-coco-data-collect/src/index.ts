/**
 * @file This plugin is to object detection data from coco format. Make sure that
 * the data is conform to expectation.
 */

import {OriginSampleData, ArgsType, unZipData, downloadZip, getDatasetDir, parseAnnotation, createAnnotationFromJson, DataCollectType} from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';
import * as assert from 'assert';
const fs = require('fs-extra');

const shuffle = (a: any[]) => {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const imageDetectionDataCollect: DataCollectType = async (args?: ArgsType): Promise<OriginSampleData> => {
  let {
    url='',
    validationSplit=0,
    testSplit=0,
    annotationFileName='annotation.json'
  } = args || {};
  assert.ok(url, 'Please specify a url of zip of your dataset');
  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');
  if (extention[extention.length - 1] !== 'zip') {
    throw new Error('the file must be zip file');
  }
  const datasetName = extention[0];

  const saveDir = path.join(getDatasetDir(), datasetName);
  fs.removeSync(saveDir);
  fs.ensureDirSync(saveDir);

  // local file
  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(saveDir, Date.now() + '.zip');
    console.log('downloading dataset ...')
    await downloadZip(url, targetPath);
    url = targetPath;
  }
  console.log('unzip and collecting data...');
  await unZipData(url, saveDir);
  const imagePaths = await glob(path.join(saveDir, 'images' ,'*.+(jpg|jpeg|png)'));
  shuffle(imagePaths);
  const countNumber = imagePaths.length;
  console.log('create annotation file...');
  const typeSet = new Set<string>();
  const annotation = require(path.join(saveDir, annotationFileName));
  for (let i = 0; i < countNumber; i++) {
    const imagePath = imagePaths[i];
    const imagePathSplit = imagePath.split(path.sep);
    const fileName = imagePathSplit[imagePathSplit.length - 1];
    const cocoImage = annotation.images.find((e: any) => e.file_name == fileName);
    const currentAnnotation: any = {
      annotation: {
        folder: [
          path.join(saveDir, 'images')
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
    })
    if (i >= countNumber * (testSplit + validationSplit)) {
      typeSet.add('train');
      createAnnotationFromJson(path.join(saveDir, 'annotations', 'train' ), currentAnnotation);
    } else if (validationSplit > 0 && i >= countNumber * validationSplit) {
      typeSet.add('validation');
      createAnnotationFromJson(path.join(saveDir ,'annotations', 'validation') ,currentAnnotation);
    } else {
      typeSet.add('test');
      createAnnotationFromJson(path.join(saveDir ,'annotations', 'test') ,currentAnnotation);
    }
  }

  if (!typeSet.has('train')) {
    throw new Error('There is no train data. Please check the folder structure');
  }
  const result: OriginSampleData = {
    trainDataPath: path.join(saveDir, 'annotations', 'train'),
  }

  if (typeSet.has('validation')) {
    result.validationDataPath = path.join(saveDir, 'annotations', 'validation');
  }
  if (typeSet.has('test')) {
    result.testDataPath = path.join(saveDir, 'annotations', 'test');
  }

  return result;
}

export default imageDetectionDataCollect;