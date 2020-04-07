# ModelEvaluate Plugin

The Model Evaluate plug-in deeply analyzes the training results of the Model to help you understand how the Model performs on the test set.

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

export interface ModelLoadArgsType extends ArgsType {
  modelId: string;
  modelPath: string;
}

export interface PipcookModel {
  model: any;
  metrics?: any;
  predict: any;
  config?: any;
}

export interface EvaluateResult {
  [key: string]: any;
}

export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniDataset, model: PipcookModel, args: ArgsType): Promise<EvaluateResult>;
}

```

- Input: the model evaluation plug-in must contain the data of the test set and the corresponding trained models.
- Output: the metric and the corresponding metric value. We do not require the type of the value.
