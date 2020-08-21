import { DataLoader, UniDataset, Metadata } from './common';

/**
 * The csv sample.
 */
export interface CsvSample {
  data: any;
  label: any;
}

/**
 * It describes how to organize a csv dataset.
 */
export interface CsvMetadata extends Metadata {
  feature: {
    /**
     * It describes the names of csv.
     */
    names: string[];
  };
}

export abstract class CsvDataLoader extends DataLoader {
  abstract getItem(id: number): Promise<CsvSample>;
}

export interface CsvDataset extends UniDataset {
  /**
   * Provides train/valid/test paths.
   */
  trainCsvPath: string;
  validationCsvPath: string;
  testCsvPath: string;
  /**
   * Extends the train/valid/test DataLoaders.
   */
  trainLoader?: CsvDataLoader;
  validationLoader?: CsvDataLoader;
  testLoader?: CsvDataLoader;
  /**
   * The metadata for csv dataset.
   */
  metadata: CsvMetadata;
}
