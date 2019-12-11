/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { UniformSampleData, OriginSampleData, ArgsType, parseAnnotation, DataAccessType} from '@pipcook/pipcook-core';
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
const concatenateDataFlows = async (fileNames: string[], imgSize: number[], oneHotMap: any, dataFlows: any[], type: string) => {
  console.log(`access ${type} image data...`);
  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  bar1.start(fileNames.length, 0);
  for (let j = 0; j < fileNames.length; j++) {
    const jsonData = await parseAnnotation(fileNames[j]);
    bar1.update(j);
    let image = await Jimp.read(path.join(jsonData.annotation.folder[0], jsonData.annotation.filename[0]));
    image = image.resize(imgSize[0], imgSize[1]);
    const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const imageArray = new Uint8Array(trainImageBuffer);
    let label:any = jsonData.annotation.object[0].name[0];
    if (Object.keys(oneHotMap).length > 1) {
      label = tf.oneHot(tf.scalar(oneHotMap[label], 'int32'), Object.keys(oneHotMap).length);
    }
    dataFlows.push({
      xs: tf.cast(tf.node.decodeImage(imageArray), 'float32'),
      ys: label
    })
  }
  bar1.stop();
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
const imageClassDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const oneHotMap = await getLabelMap(data);

  const {imgSize=[128, 128]} = args || {};

  let trainDataFlows:any[]=[], validationDataFlows:any[]=[], testDataFlows:any[]=[]
  
  for (let i = 0; i < data.length; i++) {
    const dataSample = data[i];
    const {trainDataPath, validationDataPath, testDataPath} = dataSample;  
    const trainFileNames: string[] = await glob(path.join(trainDataPath, '*.xml'));
    await concatenateDataFlows(trainFileNames, imgSize, oneHotMap, trainDataFlows, 'train data');
    if (validationDataPath) {
      const validationFileNames: string[] = await glob(path.join(validationDataPath, '*.xml'));
      await concatenateDataFlows(validationFileNames, imgSize, oneHotMap, validationDataFlows, 'validation data');
    }
    if (testDataPath) {
      const testFileNames: string[] = await glob(path.join(testDataPath, '*.xml'));
      await concatenateDataFlows(testFileNames, imgSize, oneHotMap, testDataFlows, 'test data');
    }
  }

  const result: UniformSampleData = {
    trainData: tf.data.array(trainDataFlows),
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
  if (validationDataFlows.length > 0) {
    result.validationData = tf.data.array(validationDataFlows);
  }
  if (testDataFlows.length > 0) {
    result.testData = tf.data.array(testDataFlows);
  }
  
  return result;
}

export default imageClassDataAccess;