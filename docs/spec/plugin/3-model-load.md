# ModelLoad Plugin

The ModelLoad plug-in is used to load models. Because of the differences between js and python, tfjs uses json files to store Model data, while tfpy uses protobuf (Tensorflow SavedModel, Frozen Model, etc.) and keras uses. h5 save. During the pre-training of the model, we use the ModelLoader plug-in to ensure that the model format is uniform and can be loaded correctly. It is worth noting that ModelLoad should also allow loading from models previously trained by pipcook

```ts
interface PipcookPlugin {}

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

interface ModelLoadType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ModelLoadArgsType): Promise<PipcookModel>
}
```

- Input: parameters related to model loading, including whether the model is a local model or needs to be downloaded from the Internet, the path of the model, and the format of the model.
- Output: model-related information.
