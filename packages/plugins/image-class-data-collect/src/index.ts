/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import {OriginSampleData, ArgsType, createAnnotationFile, DataCollectType, getDatasetDir, unZipData, downloadZip} from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';
import * as assert from 'assert';
const fs = require('fs-extra');
const uuidv1 = require('uuid/v1');

/**
 * collect the data either from remote url or local file. It expects a zip 
 * which contains the structure of traditional iamge classification data folder.
 * @param args argstype
 */
const imageClassRemoteDataCollect: DataCollectType = async (args?: ArgsType): Promise<OriginSampleData> => {
  let {
    url='',
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
  const imageDir = path.join(saveDir, 'images');
  console.log('unzip and collecting data...');
  await unZipData(url, imageDir);
  const imagePaths = await glob(path.join(imageDir, '+(train|validation|test)', '*', '*.+(jpg|jpeg|png)'));
  const typeSet = new Set<string>();
  console.log('create annotation file...');
  imagePaths.forEach((imagePath: string) => {
    const splitString = imagePath.split(path.sep);
    const trainType = splitString[splitString.length - 3];
    const category = splitString[splitString.length - 2];
    const imageName = uuidv1() + splitString[splitString.length -1];
    const annotationDir = path.join(saveDir, 'annotations' ,trainType);
    createAnnotationFile(annotationDir, imageName, splitString.slice(0, splitString.length - 1).join(path.sep), category);
    typeSet.add(trainType);
    fs.moveSync(imagePath, path.join(saveDir, 'images', imageName), { overwrite: true });
  });

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

export default imageClassRemoteDataCollect;