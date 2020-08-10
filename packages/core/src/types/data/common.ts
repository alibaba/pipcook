import events from 'events';

import { generateId } from '../../utils/public';
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
export abstract class DataLoader {
  private event = new events.EventEmitter();
  private fetchIndex = 0;
  private id = generateId();
  public processIndex = -1;

  /**
   * Data-access plugin developer needs to implement these three abstract function
   * which is to notify the length of data, how to get and set the specific index of data
   */
  abstract async len(): Promise<number>;
  abstract async getItem(id: number): Promise<Sample>;
  abstract async setItem(id: number, sample: Sample): Promise<void>;

  notifyProcess(): void {
    this.event.emit(this.id);
  }

  getFetchIndex(): number {
    return this.fetchIndex;
  }

  /**
   * iterate over dataset. Get next single sample
   * Override Forbidden
   */
  async next(): Promise<Sample> {
    // reset index of data fetched to beginning when it reaches the end
    if (this.fetchIndex >= await this.len()) {
      this.fetchIndex = 0;
    }

    // if the data fetched has already been processed, return it
    if (this.fetchIndex < this.processIndex || this.processIndex === -1) {
      return this.getItem(this.fetchIndex++);
    }

    // if data fetched not already processed, wait util this is finished
    return new Promise((resolve) => {
      this.event.on(this.id, async () => {
        if (this.fetchIndex < this.processIndex) {
          const data = await this.getItem(this.fetchIndex++);
          this.event.removeAllListeners(this.id);
          resolve(data);
        }
      });
    });
  }

  /**
   * iterate over dataset. Get next batch of data
   * Override Forbidden
   */
  async nextBatch(batchSize: number): Promise<Sample[]> {
    const dataLen = await this.len();

    if (this.fetchIndex >= dataLen) {
      this.fetchIndex = 0;
    }

    if (this.fetchIndex + batchSize >= dataLen) {
      batchSize = dataLen - this.fetchIndex - 1;
    }

    if (this.fetchIndex + batchSize < this.processIndex) {
      const result = [];
      for (let i = this.fetchIndex; i < this.fetchIndex + batchSize; i++) {
        result.push(this.getItem(i));
      }
      return Promise.all(result);
    }

    return new Promise((resolve) => {
      this.event.on(this.id, async () => {
        if (this.fetchIndex + batchSize < this.processIndex) {
          const result = [];
          for (let i = this.fetchIndex; i < this.fetchIndex + batchSize; i++) {
            result.push(this.getItem(i));
          }
          this.event.removeAllListeners(this.id);
          resolve(await Promise.all(result));
        }
      });
    });
  }
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
   * The batch size for this dataset
   */
  batchSize?: number;
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
