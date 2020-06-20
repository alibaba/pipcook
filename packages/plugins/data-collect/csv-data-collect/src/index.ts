/**
 * @file For plugin to collect test classification data
 */
import { DataCollectType, ArgsType, download, unZipData } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';
import glob from 'glob-promise';
import parse from 'csv-parse/lib/sync';
import stringify from 'csv-stringify/lib/sync';

const writeCsvFile = (url: string): Promise<any[]> => {
  const records = parse(fs.readFileSync(url), {
    columns: true,
    skip_empty_lines: true,
    skip_lines_with_error: true
  });
  return records;
};

/**
 * collect csv data
 */
const textClassDataCollect: DataCollectType = async (args: ArgsType): Promise<void> => {
  let {
    url = '',
    dataDir
  } = args;

  await fs.remove(dataDir);
  await fs.ensureDir(dataDir);

  assert.ok(url, 'Please specify a url of zip of your data');

  const fileName = url.split(path.sep)[url.split(path.sep).length - 1];
  const extension = fileName.split('.');

  assert.ok(extension[extension.length - 1] === 'zip', 'The dataset provided should be a zip file');

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

  const tempDir = path.join(dataDir, 'temp');
  console.log('unzip and collecting data...');
  await unZipData(url, tempDir);

  const csvPaths = await glob(path.join(tempDir, '+(train|validation|test)', '*.csv'));
  const trainData: any[] = [];
  const validationData: any[] = [];
  const testData: any[] = [];
  for (let i = 0; i < csvPaths.length; i++) {
    const csvPath = csvPaths[i];
    const splitString = csvPath.split(path.sep);
    const trainType = splitString[splitString.length - 2];
    const result = await writeCsvFile(csvPath);
    if (trainType === 'train') {
      trainData.push(...result);
    }
    if (trainType === 'validation') {
      validationData.push(...result);
    }
    if (trainType === 'test') {
      testData.push(...result);
    }
  }

  if (trainData.length > 0) {
    fs.outputFileSync(path.join(dataDir, 'train.csv'), stringify(trainData, { header: true }));
  }
  if (validationData.length > 0) {
    fs.outputFileSync(path.join(dataDir, 'validation.csv'), stringify(validationData, { header: true }));
  }
  if (testData.length > 0) {
    fs.outputFileSync(path.join(dataDir, 'test.csv'), stringify(testData, { header: true }));
  }

  fs.removeSync(tempDir);
  if (isDownload) {
    fs.removeSync(url);
  }
};

export default textClassDataCollect;
