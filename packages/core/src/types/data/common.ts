import { Statistic } from '../other';

/**
 * The descriptor for sample data or label.
 */
export interface DataDescriptor {
  type?: any;
  shape?: number[];
  names?: string[];
}

/**
 * The metadata is to describe a dataset.
 */
export interface Metadata extends Record<string, any> {
  /**
   * The feature descriptor.
   */
  feature?: DataDescriptor;
  /**
   * The label descriptor.
   */
  label?: DataDescriptor;
  /**
   * The label maps for a dataset, which is the available list for corresponding labels.
   */
  labelMap?: Record<string, number> | string[];
}

/**
 * A sample is to represent an item in a dataset.
 */
export interface Sample {
  /**
   * the sample data.
   */
  data: any;
  /**
   * the sample label.
   */
  label?: any;
}

/**
 * The data loader to used to load dataset.
 */
export interface DataLoader {
  len: () => Promise<number>;
  getItem: (id: number) => Promise<Sample>;
}

/**
 * This interface is used for representing a dataset.
 */
export interface UniDataset {
  /**
   * The metadata for this dataset.
   */
  metadata?: Metadata;
  /**
   * The statistics for the dataset.
   */
  dataStatistics: Statistic[];
  /**
   * The validation result for this dataset.
   */
  validationResult: {
    result: boolean;
    message?: string;
  };
  /**
   * The loader for training.
   */
  trainLoader?: DataLoader;
  /**
   * The loader for validation.
   */
  validationLoader?: DataLoader;
  /**
   * The loader for testing the trained model.
   */
  testLoader?: DataLoader;
}
