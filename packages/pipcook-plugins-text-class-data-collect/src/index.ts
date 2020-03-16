/**
 * @file For plugin to collect test classification data
 */
import {DataCollectType, OriginSampleData, ArgsType, getDatasetDir, download} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';
const fs = require('fs-extra')
const csv = require('csv-parser')

const transformCsv = (result: any) => {
  const texts = [];
  for (const key in result) {
    let text = result[key];
    if (text.includes(',')){
      if (text.includes('"')) {
        let newText = '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '"') {
            newText += `""`;
          } else {
            newText += text[i];
          }  
        }
        text = newText;
      } 
      text = `"${text}"`;
    }
    texts.push(text);
  }
  return texts.join(',');
}

/**
 * collect csv data
 */
const textClassDataCollect: DataCollectType = async (args?: ArgsType): Promise<OriginSampleData> => {

  let {
    hasHeader=false,
    delimiter=',',
    url='',
    validationSplit=0,
    testSplit=0
  } = args || {};

  assert.ok(url, 'Please specify a url of zip of your data');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extention = fileName.split('.');
  if (extention[extention.length - 1] !== 'csv') {
    throw new Error('the file must be zip file');
  }
  const datasetName = extention[0];

  const saveDir = path.join(getDatasetDir(), datasetName);

  fs.removeSync(saveDir);
  fs.ensureDirSync(saveDir);

  if (/^file:\/\/.*/.test(url)) {
    url = url.substring(7);
  } else {
    const targetPath = path.join(saveDir, fileName);
    console.log('downloading dataset ...')
    await download(url, targetPath);
    url = targetPath;
  }

  const promise: Promise<any> = new Promise((resolve, reject) => {
    const results: any[] = [];
    const trainData: string[] = [];
    const validationData: string[] = [];
    const testData: string[] = [];
    const typeSet = new Set<string>();
    fs.createReadStream(url)
      .pipe(csv({headers: hasHeader, separator: delimiter}))
      .on('data', (data: any) => results.push(data))
      .on('error', (err: Error) => reject(err))
      .on('end', () => {
        const countNumber = results.length;
        results.forEach((result: any, index: number) => {
          if (index >= countNumber * (testSplit + validationSplit)) {
            typeSet.add('train');
            trainData.push(transformCsv(result));
          } else if (validationSplit > 0 && index >= countNumber * validationSplit) {
            typeSet.add('validation');
            validationData.push((transformCsv(result)));
          } else {
            typeSet.add('test');
            testData.push((transformCsv(result)));
          }
        });
        fs.removeSync(url);
        const trainDataPath = path.join(saveDir, 'train.csv');
        const validationDataPath = path.join(saveDir, 'validation.csv');
        const testDataPath = path.join(saveDir, 'test.csv');
        if (typeSet.has('train')) {
          fs.outputFileSync(trainDataPath, trainData.join('\n'));
        }    
        if (typeSet.has('validation')) {
          fs.outputFileSync(validationDataPath, validationData.join('\n'));
        }
        if (typeSet.has('test')) {
          fs.outputFileSync(testDataPath, testData.join('\n'));
        }
        resolve({trainDataPath, validationDataPath, testDataPath, typeSet});
      });
  })

  
  const {trainDataPath, validationDataPath, testDataPath, typeSet} = await promise;
  
  if (!typeSet.has('train')) {
    throw new Error('There is no train data. Please check the folder structure');
  }
  const result: OriginSampleData = {
    trainDataPath,
  }

  if (typeSet.has('validation')) {
    result.validationDataPath = validationDataPath;
  }
  if (typeSet.has('test')) {
    result.testDataPath = testDataPath;
  }

  
  return result;
}

export default textClassDataCollect;




