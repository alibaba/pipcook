# ModelTrain Plugin

This plug-in is used to train a model. The interface provides the ability to configure basic parameters of the training model, but these parameters should not be required, allows plug-in developers to define the appropriate hyper-parameters within the plug-in.

```typescript
interface PipcookPlugin {
}

interface ArgsType {
  [key: string]: any;
}


interface DataDescriptor {
  name: string;
  type: DataType;
  shape: number[];
  possibleValues?: string[] | number[];
  valueMap?: any;
}

interface metaData {
  feature: DataDescriptor;
  label: DataDescriptor;
  trainSize?: number;
  validationSize?: number;
  testSize?: number;
}

interface UniformSampleData{
  trainData: any;
  validationData?: any;
  testData?: any;
  metaData: metaData;
  dataStatistics?: statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  }
}

export interface ModelLoadArgsType extends ArgsType {
  modelId: string;
}

export interface ModelLoadAndSaveFunction {
  (modelPath: string): any
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
  modelName: string;
  modelPath?: string;
  config?: any;
}


export interface ModelTrainType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], args?: ArgsType): Promise<PipcookModel>
}
```

Input: training data, loaded models, and all training-related hyper-parameters<br />Output: model information
