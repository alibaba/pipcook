import {DataCollectType, OriginSampleData, ArgsType} from '@pipcook/pipcook-core';
import * as tf from '@tensorflow/tfjs-node-gpu';
import * as assert from 'assert';
import * as path from 'path';
const fs = require('fs-extra');
const odps = require('odps');

const _assertionTest = (args?: ArgsType) => {
  const {
    accessId='',
    accessKey='',
    endpoint='',
    project='',
    table='',
    partition={},
    dataColumns=[], 
    labelColumns=[],
    validationSplit=null,
    testSplit=null
  } = args || {};
  assert.ok(accessId && accessKey && endpoint && project && table, 
    'Please specify accessId, accessKey, endpoint, project and table of the odps');
  assert.ok(dataColumns && dataColumns.length > 0 && labelColumns && labelColumns.length > 0, 
    'Please provide the columns of the data and label');
  return args;
}

const _createPromise = (client: any, project: string, table: string, partition: any) => {
  return new Promise((resolve, reject) => {
    client.getTableData(project, table, {
      partition: partition
      }, (err: Error, data: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
    })
  })
}

const _getDataset = (odpsData: any, dataColumns: string[]) => {
  const odpsColumns = odpsData.columns;
  const indexArray = dataColumns.map((column) => {
    const index = odpsColumns.indexOf(column);
    assert.ok(index !== -1, 'The column provided does not exsit');
    return index;
  });
  let type: null | string = null;
  const data = odpsData.rows.map((row: any[]) =>{
    const tensor = indexArray.map((index) => (row[index]));
    return tensor;
  });
  return {
    data: tf.data.array(data),
    type
  };
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
const _shuffle = (data: any[]) => {
  for (let i = data.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = data[i];
    data[i] = data[j];
    data[j] = temp;
  }
} 

const odpsDataCollect: DataCollectType = async (args?: ArgsType): Promise<OriginSampleData> => {
  const {
    accessId='',
    accessKey='',
    endpoint='',
    project='',
    table='',
    partition={},
    dataColumns=[],
    labelColumns=[],
    validationSplit=null,
    testSplit=null,
    trainPath=path.join(process.cwd(), 'samples', 'train.csv'),
    validationPath=path.join(process.cwd(), 'samples', 'validation.csv'),
    testPath=path.join(process.cwd(), 'samples', 'test.csv')
  } = <ArgsType> _assertionTest(args) || {};
  const client = odps.create({
    accessId, accessKey, endpoint
  });

  const odpsData: any = await _createPromise(client, project, table, partition);
  _shuffle(odpsData.rows);

  const {data, type: dataType} = _getDataset(odpsData, <string[]>dataColumns);
  const {data:label, type: labelType} = _getDataset(odpsData, labelColumns);

  const dataZip = tf.data.zip({xs: data, ys: label});
  const dataSize = Number(dataZip.size);
  let trainData=dataZip, validationData, testData;
  if (validationSplit && validationSplit > 0) {
    const validationSize = parseInt(String(validationSplit * dataSize));
    validationData = trainData.take(validationSize);
    trainData = trainData.skip(validationSize);
  }
  if (testSplit && testSplit > 0) {
    const testSize = parseInt(String(testSplit * dataSize));
    testData = trainData.take(testSize);
    trainData = trainData.skip(testSize);
  }

  let trainText = '';
  await trainData.forEachAsync((e: any) => {
    trainText += `${e.xs[0]},${e.ys[0]}\n`;
  });

  fs.outputFileSync(trainPath, trainText);

  const result: OriginSampleData = {
    trainDataPath: trainPath
  }
  if (validationData) {
    let validationText = '';
    await validationData.forEachAsync((e: any) => {
      validationText += `${e.xs[0]},${e.ys[0]}\n`;
    });
    fs.outputFileSync(validationPath, validationText);
    result.validationDataPath = validationPath;
  }
  if (testData) {
    let testText = '';
    await testData.forEachAsync((e: any) => {
      testText += `${e.xs[0]},${e.ys[0]}\n`;
    });
    fs.outputFileSync(testPath, testText);
    result.testDataPath = testPath;
  }
  return result;
}

export default odpsDataCollect;
