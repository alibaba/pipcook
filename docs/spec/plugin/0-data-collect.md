# DataCollect  Plugin

DataCollect plug-in is designed to help users collect various data and store the data in a standardized way for subsequent plug-ins in the pipeline. The sources of data can be various, such as files and folders in various local formats, files downloaded from the Internet, and data queried from databases (or ODPS. At the same time, this plug-in should also support dividing data into different datasets and clearly revealing the data format. At the same time, the plug-in should accurately output information about the data itself, such as the name of each feature, the type of the feature, the number of samples, and all relevant meta information of the data.

```
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

- Input: DataCollect does not force input parameters. In principle, the plug-in can obtain data from any sources and channels, and is divided into datasets and test sets according to certain principles. We recommend that you specify the data source type (for example, local file storage or download from the network) to help you configure the data more clearly.
- Output: The data collection plug-in should store the data locally. in the dataset folder of pipcook-log, the data folder name is the dataset name, which organizes data according to a certain structure, and returns the paths of the training set, validation set, and test set.
