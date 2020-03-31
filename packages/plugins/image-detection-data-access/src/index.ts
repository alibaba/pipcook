/**
 * @file This plugin is to object detection data from PASCOL VOC format. Make sure that
 * the data is conform to expectation.
 */

import { UniformTfSampleData, OriginSampleData, ArgsType, parseAnnotation, DataAccessType } from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import Jimp from 'jimp';
import glob from 'glob-promise';
import * as path from 'path';
const _cliProgress = require('cli-progress');

const concatenateDataFlows = async (fileNames: string[], imgSize: number[], oneHotMap: any, dataFlows: any[], type: string) => {
  console.log(`access ${type} image data...`);
  const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);
  bar1.start(fileNames.length, 0);
  for (let j = 0; j < fileNames.length; j++) {
    const jsonData = await parseAnnotation(fileNames[j]);
    bar1.update(j);
    let image = await Jimp.read(path.join(jsonData.annotation.folder[0], jsonData.annotation.filename[0]));
    const xratio = 1.0 * imgSize[0] / image.bitmap.width;
    const yratio = 1.0 * imgSize[1] / image.bitmap.height;
    image = image.resize(imgSize[0], imgSize[1]);
    const trainImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    const imageArray = new Uint8Array(trainImageBuffer);
    const target = [];
    jsonData.annotation.object.forEach((item: any) => {
      target.push(oneHotMap[item.name[0]]);
      target.push(parseFloat(item.bndbox[0].xmin[0]) * xratio );
      target.push(parseFloat(item.bndbox[0].xmax[0]) * xratio ); 
      target.push(parseFloat(item.bndbox[0].ymin[0]) * yratio ); 
      target.push(parseFloat(item.bndbox[0].ymax[0]) * yratio ); 
    });
    for (let ii = jsonData.annotation.object.length; ii < 10; ii++) {
      target.push(-1);
      for (let jj = 0; jj < 4; jj++) {
        target.push(0);
      }
    }
    dataFlows.push({
      xs: tf.cast(tf.node.decodeImage(imageArray, 3), 'float32'),
      ys: tf.tensor1d(target)
    });
  }
  bar1.stop();
};

/**
 * merge all possible values of labels. Get the map between label and numeric value
 * @param data 
 */
const getLabelMap = async (data: OriginSampleData[]) => {
  const labelSet = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const dataItem = data[i];
    const { trainDataPath } = dataItem;
    const trainFileNames: string[] = await glob(path.join(trainDataPath, '*.xml'));
    for (let j = 0; j < trainFileNames.length; j++) {
      const fileName = trainFileNames[j];
      const imageData: any = await parseAnnotation(fileName);
      imageData.annotation.object.forEach((item: any) => {
        labelSet.add(item.name[0]);
      });
      
    }
  }
  const labelArray = Array.from(labelSet);
  const oneHotMap: any = {};
  labelArray.forEach((label: any, index: number) => {
    oneHotMap[label] = index;
  });
  return oneHotMap;
};

/**
 * The plugin used to access data from different sources. It will detect all possible values of labels and 
 * merge them into numeric expressions.
 * @param data: origin sample data
 * @param imgSize: the image size to uniform
 */
const imageDetectionDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformTfSampleData> => {
  if (!Array.isArray(data)) {
    data = [ data ];
  }
  const { imgSize = [ 224, 224 ] } = args || {};

  const oneHotMap = await getLabelMap(data);

  const trainDataFlows: any[] = [], validationDataFlows: any[] = [], testDataFlows: any[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const dataSample = data[ i ];
    const { trainDataPath, validationDataPath, testDataPath } = dataSample;  
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

  const result: UniformTfSampleData = {
    trainData: tf.data.array(trainDataFlows),
    metaData: {
      feature:
        {
          name: 'xs',
          type: 'float32',
          shape: [ imgSize[ 0 ], imgSize[ 1 ], 3 ]
        },
      label: {
        name: 'ys',
        type: 'int32',
        shape: [ 1, Object.keys(oneHotMap).length ],
        valueMap: oneHotMap
      }
    }
  };
  if (validationDataFlows.length > 0) {
    result.validationData = tf.data.array(validationDataFlows);
  }
  if (testDataFlows.length > 0) {
    result.testData = tf.data.array(testDataFlows);
  }
  
  return result;
};

export default imageDetectionDataAccess;
