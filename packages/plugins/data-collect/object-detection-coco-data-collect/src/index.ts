/**
 * @file This plugin is to object detection data from coco format. Make sure that
 * the data is conform to expectation.
 */

import { ArgsType, unZipData, download, createAnnotationFromJson, DataCollectType } from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';

const createAnnotation = (folder: string, fileName: string, width: number, height: number, objects: any, annotation: any) => {
  const currentAnnotation: any = {
    annotation: {
      folder: [
        folder
      ],
      filename: [
        fileName
      ],
      size: [
        {
          width: [
            width
          ],
          height: [
            height
          ]
        }
      ],
      segmented: [
        0
      ]
    }
  };
  currentAnnotation.annotation.object = objects.map((object: any) => {
    if (!object.category_name) {
      const category = annotation.categories.find((e: any) => e.id == object.category_id).name;
      object.category_name = category;
    }
    return {
      name: [ object.category_name ],
      pose: [ "Unspecified" ],
      truncated: [ "0" ],
      difficult: [ "0" ],
      bndbox: [
        {
          xmin: [ object.bbox[0] ],
          ymin: [ object.bbox[1] ],
          xmax: [ object.bbox[0] + object.bbox[2] ],
          ymax: [ object.bbox[1] + object.bbox[3] ]
        }
      ],
      segmentation: object.segmentation || [],
      iscrowd: object.iscrowd || 0,
      area: object.area || 0
    };
  });
  createAnnotationFromJson(folder, currentAnnotation);
};

const imageDetectionDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url = '',
    dataDir
  } = args;

  await fs.remove(dataDir);
  await fs.ensureDir(dataDir);

  assert.ok(url, 'Please specify a url of zip of your dataset');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');

  assert.ok(extention[extention.length - 1] === 'zip', 'The dataset provided should be a zip file');

  let isDownload = false;
  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(dataDir, uuidv1() + '.zip');
    console.log('downloading dataset ...');
    await download(url, targetPath);
    url = targetPath;
    isDownload = true;
  }

  const imageDir = path.join(dataDir, 'images');
  console.log('unzip and collecting data...');
  await unZipData(url, imageDir);
  const annotationPaths = await glob(path.join(imageDir, '**','+(train|validation|test)', 'annotation.json'));
  annotationPaths.forEach((annotationPath) => {
    const splitString = annotationPath.split(path.sep);
    const trainType = splitString[splitString.length - 2];

    const annotation = fs.readJSONSync(annotationPath);
    annotation.images.forEach((image: any) => {
      if (fs.existsSync(path.join(imageDir, trainType, image.file_name))) {
        const objects = annotation.annotations.filter((e: any) => e.image_id == image.id);
        if (objects.length > 0) {
          fs.moveSync(path.join(imageDir, trainType, image.file_name), path.join(dataDir, trainType, image.file_name));
          createAnnotation(path.join(dataDir, trainType), image.file_name, image.width, image.height, objects, annotation);
        }
      }
    });
  });

  if (isDownload) {
    fs.removeSync(url);
  }
  fs.removeSync(imageDir);
};

export default imageDetectionDataCollect;
