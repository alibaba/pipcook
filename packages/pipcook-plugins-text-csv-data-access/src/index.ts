/**
 * @file This plugin is to access classification text data from different sources. Make sure that
 * the data is conform to expectation.
 */

import {UniformSampleData, OriginSampleData, ArgsType, DataAccessType} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';

const concatenateDataFlows = (dataFlows: tf.data.Dataset<any>[]) => {
  let uniformData = dataFlows[0];
  for (let i = 1; i < dataFlows.length; i++) {
    uniformData = uniformData.concatenate(dataFlows[i]);
  }
  return uniformData;
}

/**
 * 
 * @param url the url/path of csv file
 * @param hasHeader if the csv has headers
 * @param delimiter the delimiter of csv dataset
 */
async function getDataset(url: string, hasHeader: boolean, delimiter: string): Promise<tf.data.Dataset<any>> {
  const dataset: tf.data.CSVDataset = tf.data.csv(
    'file://' + url, {
      hasHeader,
      columnNames: ['data', 'label'],
      columnConfigs: {
        label: {
          isLabel: true
        }
      },
      delimiter
    }
  );
  const datasetArray: any[] = [];
  await dataset.forEachAsync((e: any) => {
    datasetArray.push({
      xs: tf.tensor1d([e.xs.data], 'string'),
      ys: tf.tensor1d([e.ys.label], 'string')
    })
  })
  return tf.data.array(datasetArray);
}

/**
 * the main entry for plugin which is used to access text classification data
 * @param data Pipcook origin sample data
 * @param args oneHotTransfer: if current plugin will transfer label data to one-hot (only used when it's not one hot data.)
 */
const textClassDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const { 
    hasHeader=false,
    delimiter=',',
  } = args || {};

  const trainDataFlows:any = [], 
  validationDataFlows:any = [], 
  testDataFlows:any = [];

  for (let i = 0; i < data.length; i++) {
    const dataSample = data[i];
    const {trainDataPath, validationDataPath, testDataPath} = dataSample;
    const trainData: tf.data.Dataset<any> = await getDataset(trainDataPath, hasHeader, delimiter);
    trainDataFlows.push(trainData);
    let validationData : tf.data.Dataset<any>;
    if (validationDataPath) {
      validationData = await getDataset(validationDataPath, hasHeader, delimiter);
      validationDataFlows.push(validationData);
    }
    let testData: tf.data.Dataset<any>;
    if (testDataPath) {
      testData = await getDataset(testDataPath, hasHeader, delimiter);
      testDataFlows.push(testData);
    }
  }
   
  assert.ok(trainDataFlows.length > 0, 'No train data is found!');
  let uniformData = concatenateDataFlows(trainDataFlows);
  const result: UniformSampleData = {
    trainData: uniformData,
    metaData: {
      feature:
        {
          name: 'xs',
          type: 'string',
          shape: [1]
        },
      label: {
        name: 'ys',
        type: 'string',
        shape: [1]
      },
    }
  };
  if (validationDataFlows.length > 0) {
    let validationData = concatenateDataFlows(validationDataFlows);
    result.validationData = validationData;
  }
  if (testDataFlows.length > 0) {
    let testData = concatenateDataFlows(testDataFlows); 
    result.testData = testData;
  }
  
  return result;
}

export default textClassDataAccess;