# DataAccess 插件

此插件为数据接入插件，旨在将不同来源的数据 dataset 统一接入 pipcook。同时，你可以在此插件中进行一定的数据验证，以确保数据接入质量。

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

interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}

```

- 输入：DataAccess 接受 DataCollect 的 输出结果
- 输出： 在 DataAccess 的输出基础上，此插件可选择性的进行数据集相关统计数据的计算和验证，例如对于图片数据，我们可以计算图片的平均值和方差和特征向量等，从而对数据集质量进行一个评估并输出，同时，数据接入会把数据接入内存，输出为 tf.dataset 或者其余格式
