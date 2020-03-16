import * as tf from '@tensorflow/tfjs-node-gpu';
import {MetaData, Statistic} from './other';

export interface UniformSampleData {
  trainData: any;
  validateData?: any;
  testData?: any;
  metaData: MetaData;
  dataStatistics?: Statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  };
}

export interface UniformTfSampleData extends UniformSampleData {
  trainData: tf.data.Dataset<{xs: tf.Tensor<any>; ys?: tf.Tensor<any>}>;
  validateData?: tf.data.Dataset<{xs: tf.Tensor<any>; ys?: tf.Tensor<any>}>;
  testData?: tf.data.Dataset<{xs: tf.Tensor<any>; ys?: tf.Tensor<any>}>;
}

export interface UniformGeneralSampleData extends UniformSampleData {
  trainData: string;
  validateData?: string;
  testData?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InsertParams {}