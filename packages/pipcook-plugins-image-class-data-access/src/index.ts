/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { UniformTfSampleData, OriginSampleData, ArgsType, parseAnnotation, DataAccessType} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import glob from 'glob-promise';
import * as path from 'path';
const _cliProgress = require('cli-progress');

/**
 * read image, parse xml annotaiton and read them into tf.data
 * @param fileNames image file names
 * @param imgSize uniform image size
 * @param oneHotMap map between label and its one-hot representation
 * @param dataFlows sample data
 * @param type : train/test/validation
 */
const concatenateDataFlows = async (fileNames: string[], imgSize: number[], oneHotMap: any, type: string, imagePath: string) => {
  console.log(`access ${type} image data...`);
  let dataFlows: any = [];
  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  bar1.start(fileNames.length, 0);
  for (let j = 0; j < fileNames.length; j++) {
    const jsonData = await parseAnnotation(fileNames[j]);
    bar1.update(j);
    let image = await Jimp.read(path.join(imagePath, jsonData.annotation.filename[0]));
    image = image.resize(imgSize[0], imgSize[1]);
    const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const imageArray = new Uint8Array(trainImageBuffer);
    let label:any = jsonData.annotation.object[0].name[0];
    if (Object.keys(oneHotMap).length > 1) {
      label = tf.tidy(() => tf.oneHot(tf.scalar(oneHotMap[label], 'int32'), Object.keys(oneHotMap).length));
    }
    dataFlows.push(tf.tidy(() => ({
      xs: imageArray,
      ys: label
    })));
  }
  dataFlows = tf.data.array(dataFlows);
  const dataset = dataFlows.map((data: any) => {
    const {xs, ys} = data;
    return tf.tidy(() => (
      {
        xs: tf.tidy(() => tf.cast(tf.node.decodeImage(xs, 3), 'float32')),
        ys: ys
      }
    ));
  })
  bar1.stop();
  return dataset;
}

/**
 * merge all possible values of labels. Get the map between label and numeric value
 * @param data 
 */
const getLabelMap = async (data: OriginSampleData[]) => {
  const labelSet = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const dataItem = data[i];
    const {trainDataPath} = dataItem;
    const trainFileNames: string[] = await glob(path.join(trainDataPath, '*.xml'));
    for (let j = 0; j < trainFileNames.length; j++) {
      const fileName = trainFileNames[j];
      const imageData: any = await parseAnnotation(fileName);
      labelSet.add(imageData.annotation.object[0].name[0]);
    }
  }
  const labelArray =  Array.from(labelSet);
  const oneHotMap: any = {};
  labelArray.forEach((label: any, index: number) => {
    oneHotMap[label] = index;
  });
  return oneHotMap;
}

/**
 * The plugin used to access data from different sources. It will detect all possible values of labels and 
 * merge them into numeric expressions.
 * @param data: origin sample data
 * @param imgSize: the image size to uniform
 */
const imageClassDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformTfSampleData> => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const oneHotMap = await getLabelMap(data);

  const {imgSize=[128, 128]} = args || {};

  let trainDataFlows:any, validationDataFlows:any, testDataFlows:any;
  
  for (let i = 0; i < data.length; i++) {
    const dataSample = data[i];
    const {trainDataPath, validationDataPath, testDataPath} = dataSample;  
    const imagePath = path.join(trainDataPath, '..', '..', 'images')
    const trainFileNames: string[] = await glob(path.join(trainDataPath, '*.xml'));
    trainDataFlows = await concatenateDataFlows(trainFileNames, imgSize, oneHotMap, 'train data', imagePath);
    if (validationDataPath) {
      const validationFileNames: string[] = await glob(path.join(validationDataPath, '*.xml'));
      validationDataFlows = await concatenateDataFlows(validationFileNames, imgSize, oneHotMap, 'validation data', imagePath);
    }
    if (testDataPath) {
      const testFileNames: string[] = await glob(path.join(testDataPath, '*.xml'));
      testDataFlows = await concatenateDataFlows(testFileNames, imgSize, oneHotMap, 'test data', imagePath);
    }
  }


  const result: UniformTfSampleData = {
    trainData: trainDataFlows,
    metaData: {
      feature:
        {
          name: 'xs',
          type: 'float32',
          shape: [imgSize[0], imgSize[1], 3]
        },
      label: {
        name: 'ys',
        type: 'int32',
        shape: [1,Object.keys(oneHotMap).length],
        valueMap: oneHotMap
      },
    }
  };
  if (validationDataFlows && validationDataFlows.size > 0) {
    result.validationData = validationDataFlows;
  }
  if (testDataFlows && testDataFlows.size > 0) {
    result.testData = testDataFlows;
  }


  
  
  return result;
}

export default imageClassDataAccess;