DataCollect 插件旨在帮助用户收集各种数据，并将数据以一种标准化的方式储存下来，供管道中后续插件使用。数据的来源可以是多样的，例如本地各种格式的文件和文件夹，网络下载的文件，数据库（或者odps）等 query 下来的数据。同时，此插件还应该支持将数据划分为不同的数据集，并将数据格式明确的透露出来。同时，此插件应该准确的输出关于数据本身的信息，例如每个 feature 的名字， feature 的类型，样本数量， 以及数据的所有相关的 meta 信息。
```typescript
export interface OriginSampleData {
  trainDataPath: string;
  testDataPath?: string;
  validationDataPath?: string;
}

interface PipcookPlugin {
}

export interface ArgsType {
  [key: string]: any;
}

interface DataCollectType extends PipcookPlugin {
  (args?: ArgsType): Promise<OriginSampleData>; 
}
```

- 输入： DataCollect 不强制有输入的参数，原则上插件内部可以从任意来源和途径获取数据，并按照一定的原则划分为数据集和测试集。我们推荐指定数据来源的类型（例如是本地文件存储还是需要从网络下载），这样能帮助使用者更加清晰的配置。
- 输出: 数据收集插件应该将数据保存在本地的 .pipcook-log 的 dataset 文件夹中，数据文件夹名字为数据集名字，里面按照一定结构组织数据，并且将训练集，验证集和测试集的路径返回
