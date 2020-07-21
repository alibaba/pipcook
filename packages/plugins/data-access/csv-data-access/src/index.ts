/**
 * @file This plugin is to access classification text data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { ArgsType, CsvDataLoader, CsvDataset, CsvSample, DataAccessType } from '@pipcook/pipcook-core';
import * as fs from 'fs';
import * as path from 'path';
import parse from 'csv-parse/lib/sync';

class DataLoader implements CsvDataLoader {
  records!: CsvSample[];

  constructor(csvPath: string, labelColumn: string) {
    const records = parse(fs.readFileSync(csvPath), {
      columns: true
    });
    this.records = records.map((record: any) => {
      const label = record[labelColumn];
      delete record[labelColumn];
      return {
        label,
        data: record
      };
    });
  }

  async len() {
    return this.records.length;
  }

  async getItem(id: number) {
    return this.records[id];
  }
}

/**
 * the main entry for plugin which is used to access text classification data
 * @param args oneHotTransfer: if current plugin will transfer label data to one-hot (only used when it's not one hot data.)
 */
const csvDataAccess: DataAccessType = async (args: ArgsType): Promise<CsvDataset> => {
  const {
    dataDir,
    labelColumn
  } = args;

  const data: any = {
    dataStatistics: [],
    validationResult: {
      result: true
    },
    trainCsvPath: path.join(dataDir, 'train.csv'),
    validationCsvPath: path.join(dataDir, 'validation.csv'),
    testCsvPath: path.join(dataDir, 'test.csv')
  };

  const names: string[] = [];
  if (fs.existsSync(path.join(dataDir, 'train.csv')) && labelColumn) {
    data.trainLoader = new DataLoader(path.join(dataDir, 'train.csv'), labelColumn);
  }
  if (fs.existsSync(path.join(dataDir, 'validation.csv')) && labelColumn) {
    data.validationLoader = new DataLoader(path.join(dataDir, 'validation.csv'), labelColumn);
  }
  if (fs.existsSync(path.join(dataDir, 'test.csv')) && labelColumn) {
    data.testLoader = new DataLoader(path.join(dataDir, 'test.csv'), labelColumn);
  }

  const loader = data.trainLoader || data.validationLoader || data.testLoader;

  if (loader) {
    const data = await loader.getItem(0);
    names.push(
      ...Object.keys(data.data)
    );
  }

  const result: CsvDataset = {
    ...data,
    metadata: {
      feature: {
        names
      }
    }
  };

  return result;
};

export default csvDataAccess;
