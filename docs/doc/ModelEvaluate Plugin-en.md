The Model Evaluate plug-in deeply analyzes the training results of the Model to help you understand how the Model performs on the test set.

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


interface EvaluateResult {
  [key: string]: any;
}

export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], args?: ArgsType): Promise<EvaluateResult>
}
```

- Input: the model evaluation plug-in must contain the data of the test set and the corresponding trained models.
- Output: the metric and the corresponding metric value. We do not require the type of the value.
