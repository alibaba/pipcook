import {DataLoader, UniDataset, MetaData} from './data';

export interface CsvSample {
  data: any;
  label: any;
}

export interface CsvMetaData extends MetaData {
  feature: {
    featureNames: string[];
  };
}

export interface CsvDataLoader extends DataLoader {
  getItem: (id: number) => Promise<CsvSample>;
}

export interface CsvDataset extends UniDataset {
  trainCsvPath: string;
  testCsvPath: string;
  validationCsvPath: string;
  trainLoader?: CsvDataLoader;
  validationLoader?: CsvDataLoader;
  testLoader?: CsvDataLoader;
  metaData: CsvMetaData;
}