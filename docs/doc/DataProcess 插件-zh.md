# DataProcess 插件

在数据接入插件统一了数据格式并输出当前训练数据之后，DataProcess 插件负责在数据进入模型前做统一的预处理操作，包括数据清理，数据变换，数据标准化等。理论上您可以在此插件对您的数据进行任何形式的处理，包括对数据 feature 的改变或者维度的改变。

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

interface OriginSampleData {
  trainDataPath: string;
  testDataPath?: string;
  validationDataPath?: string;
}


interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

- 输入： 处理之前的数据
- 输出： 处理之后的数据 （由于对数据进行可能的改动，输出的metadata 的信息和输入的 metadata 的信息不一定相同

