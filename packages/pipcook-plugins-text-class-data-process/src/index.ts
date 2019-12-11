/**
 * @file this is for plugin to process text claasifiaction
 */
import {UniformSampleData, ArgsType, DataProcessType} from '@pipcook/pipcook-core'
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import nodejieba from 'nodejieba';

const processText = (data: tf.data.Dataset<any>) => {
  return data.map((e: any) => {
    let splitWordResult = nodejieba.cutHMM(e.xs.dataSync()[0]);
    splitWordResult = splitWordResult.filter((word: string) => word.trim() !== '');
    splitWordResult = splitWordResult.join(' ');
    return {xs: tf.tensor1d([splitWordResult], 'string'), ys: e.ys}
  })
}

const textClassDataProcess: DataProcessType = async (data: UniformSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  const {
    splitWord = true
  } = args || {};

  const {trainData, validationData, testData, metaData} = data;
  assert.ok(metaData.feature && metaData.label.name, 'data should have feature');
  assert.ok(metaData.label && metaData.label.name, 'data should have label');
  assert.ok(trainData != null, 'The train data cannot be empty');
  let trainDataProcessed, validationDataProcessed, testDataProcessed;
  if (splitWord) {
    trainDataProcessed = processText(trainData);
  }
  if (splitWord && validationData) {
    validationDataProcessed = processText(validationData);
  }
  if (splitWord && testData) {
    testDataProcessed = processText(testData);
  }

  const result: UniformSampleData = {
    trainData: <tf.data.Dataset<any>>trainDataProcessed,
    metaData: data.metaData
  };

  if (validationData) {
    result.validationData = validationDataProcessed
  }
  if (testData) {
    result.testData = testDataProcessed
  }

  return result;
}

export default textClassDataProcess;