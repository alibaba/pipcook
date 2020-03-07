# DataProcess Plugin

After the data access plug-in unifies the data format and outputs the current training data, the DataProcess plug-in Performs unified pre-processing operations before the data enters the model, including data cleaning, data transformation, and data standardization. Theoretically, you can use this plug-in to process your data in any form, including changes to data features or Wei Du.

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

interface OriginSampleData {
  trainDataPath: string;
  testDataPath?: string;
  validationDataPath?: string;
}

interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

- Input: process previous data
- Output: processed data (due to possible changes to the data, the output metadata information is not necessarily the same as the input metadata information.

