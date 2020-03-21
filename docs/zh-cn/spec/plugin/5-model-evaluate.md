# ModelEvaluate 插件

Model Evaluate 插件对模型的训练结果进行深入分析，以帮助您了解模型对测试集的表现如何。

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

- 输入： 模型评估插件需要包含测试集的数据以及相应的训练过的模型
- 输出： 衡量指标和相应的衡量数值，我们不强要求数值的类型
