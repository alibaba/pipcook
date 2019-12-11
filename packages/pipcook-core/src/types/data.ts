import * as tf from '@tensorflow/tfjs-node-gpu';
import {metaData, statistic} from './other';

export interface OriginSampleData {
  trainDataPath: string;
  testDataPath?: string;
  validationDataPath?: string;
}

export interface UniformSampleData{
  trainData: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  validationData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  testData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  metaData: metaData;
  dataStatistics?: statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  }
}