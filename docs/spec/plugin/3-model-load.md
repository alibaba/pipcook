# ModelLoad Plugin

The ModelLoad plug-in is used to load models. Because of the differences between js and python, tfjs uses json files to store Model data, while tfpy uses protobuf (Tensorflow SavedModel, Frozen Model, etc.) and keras uses. h5 save. During the pre-training of the model, we use the ModelLoader plug-in to ensure that the model format is uniform and can be loaded correctly. It is worth noting that ModelLoad should also allow loading from models previously trained by pipcook

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

export interface ModelLoadType extends PipcookPlugin {
  (data: UniDataset, args: ModelLoadArgsType): Promise<PipcookModel>;
}
```

- Input: parameters related to model loading, including whether the model is a local model or needs to be downloaded from the Internet, the path of the model, and the format of the model.
- Output: model-related information.
