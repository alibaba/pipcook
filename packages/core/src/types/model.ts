export interface PipcookModel {
  model: any;
  metrics?: any;
  predict: any;
  config?: any;
}

export type TfJsLayersModel = PipcookModel

export interface PytorchModel extends PipcookModel {
  criterion: any;
  optimizer: any;
}
