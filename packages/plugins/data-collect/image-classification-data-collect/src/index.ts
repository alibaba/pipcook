/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { ArgsType, createAnnotationFile, DataCollectType, unZipData, download } from '@pipcook/pipcook-core';

import glob from 'glob-promise';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';
import { generate } from 'shortid';

/**
 * collect the data either from remote url or local file system. It expects a zip
 * which contains the structure of traditional image classification data folder.
 *
 * The structure should be:
 * - train
 *  - category1-name
 *    - image1.jpg
 *    - image2.jpe
 *    - ...
 *  - category2-name
 *  - ...
 * - test (optional)
 * - validate (optional)
 *
 * @param url path of the data, if it comes from local file, please add file:// as prefix
 */
const imageClassDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url = '',
    dataDir
  } = args;

  await fs.remove(dataDir);
  await fs.ensureDir(dataDir);

  assert.ok(url, 'Please specify the url of your dataset');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');

  assert.ok(extention[extention.length - 1] === 'zip', 'The dataset provided should be a zip file');

  let isDownload = false;
  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(dataDir, generate() + '.zip');
    console.log('downloading dataset ...');
    await download(url, targetPath);
    url = targetPath;
    isDownload = true;
  }

  const imageDir = path.join(dataDir, 'images');
  console.log('unzip and collecting data...');
  await unZipData(url, imageDir);
  const imagePaths = await glob(path.join(imageDir, '**', '+(train|validation|test)', '*', '*.+(jpg|jpeg|png)'));
  console.log('create annotation file...');
  imagePaths.forEach((imagePath: string) => {
    const splitString = imagePath.split(path.sep);
    const trainType = splitString[splitString.length - 3];
    const category = splitString[splitString.length - 2];
    const imageName = generate() + splitString[splitString.length - 1];
    const annotationDir = path.join(dataDir, trainType);
    createAnnotationFile(annotationDir, imageName, splitString.slice(0, splitString.length - 1).join(path.sep), category);
    fs.moveSync(imagePath, path.join(annotationDir, imageName), { overwrite: true });
  });

  if (isDownload) {
    fs.removeSync(url);
  }
  fs.removeSync(path.join(dataDir, 'images'));
};

export default imageClassDataCollect;
