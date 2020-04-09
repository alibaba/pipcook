# DataProcess Plugin

After the data access plug-in unifies the data format and outputs the current training data, the DataProcess plug-in Performs unified pre-processing operations before the data enters the model, including data cleaning, data transformation, and data standardization. Theoretically, you can use this plug-in to process your data in any form, including changes to data features or Wei Du.

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

export interface DataProcessType extends PipcookPlugin {
  (data: UniDataset, args: ArgsType): Promise<UniDataset>;
}
```

- Input: process previous data
- Output: processed data (due to possible changes to the data, the output metadata information is not necessarily the same as the input metadata information.

