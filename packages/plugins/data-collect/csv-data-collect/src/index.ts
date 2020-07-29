/**
 * @file For plugin to collect test classification data
 */
import { DataCollectType, ArgsType, downloadAndExtractTo } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs-extra';
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

  const tempDir = await downloadAndExtractTo(url);
  const csvPaths = await glob(path.join(tempDir, '**', '+(train|validation|test)', '*.csv'));
  const trainData: any[] = [];
  const validationData: any[] = [];
  const testData: any[] = [];
  for (let i = 0; i < csvPaths.length; i++) {
    const csvPath = csvPaths[i];
    const splitString = csvPath.split(path.sep);
    const trainType = splitString[splitString.length - 2];
    const result = await writeCsvFile(csvPath);
    if (trainType === 'train') {
      result.forEach((re) => {
        trainData.push(re);
      });
    }
    if (trainType === 'validation') {
      result.forEach((re) => {
        validationData.push(re);
      });
    }
    if (trainType === 'test') {
      result.forEach((re) => {
        testData.push(re);
      });
    }
  }

  if (trainData.length > 0) {
    await fs.outputFile(path.join(dataDir, 'train.csv'), stringify(trainData, { header: true }));
  }
  if (validationData.length > 0) {
    await fs.outputFile(path.join(dataDir, 'validation.csv'), stringify(validationData, { header: true }));
  }
  if (testData.length > 0) {
    await fs.outputFile(path.join(dataDir, 'test.csv'), stringify(testData, { header: true }));
  }
  await fs.remove(tempDir);
};

export default textClassDataCollect;
