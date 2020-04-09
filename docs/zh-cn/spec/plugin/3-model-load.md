# ModelDefine 插件

ModelDefine 插件是用来加载模型的，由于 js 和 python 的差别，tfjs 使用 json 文件来保存模型数据，而 tfpy 使用 protobuf (Tensorflow SavedModel, Frozen Model等)，keras 使用.h5 保存。在预训练模型时，为了保证模型格式统一并且能被正确的加载，我们使用 ModelDefine 插件来处理。值得注意是，ModelDefine 应该还允许从 pipcook 之前训练过的模型中加载

```
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

export interface ModelDefineArgsType extends ArgsType {
  modelId: string;
}

export interface ModelDefineAndSaveFunction {
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
  save: ModelDefineAndSaveFunction;
  predict: any;
  modelName: string;
  modelPath?: string;
  config?: any;
}

interface ModelDefineType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ModelDefineArgsType): Promise<PipcookModel>
}

```

- 输入：模型加载的相关参数，包括是本地模型还是需要从网上下载，模型的路径，模型的格式等
- 输出：模型相关信息
