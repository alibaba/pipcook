export interface UniModel {
  model: any;
  metrics?: any;
  predict: any;
  config?: any;
}

export type TfJsLayersModel = UniModel

export interface PytorchModel extends UniModel {
  criterion: any;
  optimizer: any;
}
