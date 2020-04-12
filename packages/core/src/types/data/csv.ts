import { DataLoader, UniDataset, Metadata } from './common';

export interface CsvSample {
  data: any;
  label: any;
}

export interface CsvMetadata extends Metadata {
  feature: {
    names: string[];
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
  metadata: CsvMetadata;
}
