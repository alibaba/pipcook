# DataAccess Plugin

This plugin is a data access plug-in, designed to connect datasets from different sources to pipcook. At the same time, you can perform certain data verification in this plug-in to ensure the quality of data access.

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

export interface DataAccessType extends PipcookPlugin {
  (args: ArgsType): Promise<UniDataset>;
}
```

- Input: DataAccess accepts the output of DataCollect.
- Output: based on the output of DataAccess, this plug-in can selectively calculate and verify data related to Datasets. For example, for image data, we can calculate the average value, variance, and eigenvector of images, therefore, the quality of the data set is evaluated and output. At the same time, data access will connect the data to the memory, and the output is tf. dataset or other formats
