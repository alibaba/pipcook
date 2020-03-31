import * as tf from '@tensorflow/tfjs-node-gpu';

export interface ModelLoadAndSaveFunction {
  (modelPath: string): any;
}

export interface PipcookModel {
  model: any;
  type: 'text classification' | 'image classification' | 'object detection';
  metrics?: any;
  inputShape?: number[];
  inputType: string;
  outputShape?: number[];
  outputType: string;
  history?: tf.History;
  save: ModelLoadAndSaveFunction;
  predict: any;
  config?: any;
  extraParams?: any;
}
