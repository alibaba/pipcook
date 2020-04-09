# ModelTrain Plugin

This plug-in is used to train a model. The interface provides the ability to configure basic parameters of the training model, but these parameters should not be required, allows plug-in developers to define the appropriate hyper-parameters within the plug-in.

```ts
export interface DataDescriptor {
  type?: DataType;
  shape?: number[];
  featureNames?: string[];
}

export interface MetaData {
  feature?: DataDescriptor;
  label?: DataDescriptor;
  labelMap?: {[key: string]: number};
}

export interface Sample {
  data: any;
  label: any;
}

export interface DataLoader {
  len: () => Promise<number>;
  getItem: (id: number) => Promise<Sample>;
}

export interface UniDataset {
  metaData?: MetaData;
  dataStatistics: Statistic[];
  validationResult: {
    result: boolean;
    message?: string;
  };
  trainLoader?: DataLoader;
  validationLoader?: DataLoader;
  testLoader?: DataLoader;
}

export interface ArgsType {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
  [key: string]: any;
}

export interface ModelDefineArgsType extends ArgsType {
  modelId: string;
  modelPath: string;
}

export interface PipcookModel {
  model: any;
  metrics?: any;
  predict: any;
  config?: any;
}

export interface ModelTrainType extends PipcookPlugin {
  (data: UniDataset, model: PipcookModel, args: ModelTrainArgsType): Promise<PipcookModel>;
}
```

- Input: training data, loaded models, and all training-related hyper-parameters.
- Output: model information.
