# DataAccess Plugin

This plugin is a data access plug-in, designed to connect datasets from different sources to pipcook. At the same time, you can perform certain data verification in this plug-in to ensure the quality of data access.

```typescript
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

- Input: DataAccess accepts the output of DataCollect.
- Output: based on the output of DataAccess, this plug-in can selectively calculate and verify data related to Datasets. For example, for image data, we can calculate the average value, variance, and eigenvector of images, therefore, the quality of the data set is evaluated and output. At the same time, data access will connect the data to the memory, and the output is tf. dataset or other formats
