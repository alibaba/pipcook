import * as tf from '@tensorflow/tfjs-node-gpu';


export interface PipcookModel {
  model: any;
  metrics?: any;
  predict: any;
  config?: any;
  extraParams?: any;
}

export interface TfJsLayersModel extends PipcookModel {
  model: tf.LayersModel;
}

export interface PytorchModel extends PipcookModel {
  criterion: any;
  optimizer: any;
}