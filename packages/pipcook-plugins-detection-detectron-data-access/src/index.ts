/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { UniformGeneralSampleData, OriginSampleData, ArgsType, convertPascol2CocoFileOutput, DataAccessType} from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';

const imageDetectronDataAccess: DataAccessType = async (data: OriginSampleData[] | OriginSampleData, args?: ArgsType): Promise<UniformGeneralSampleData> => {
  if (Array.isArray(data)) {
    throw new Error('only one dataset can be specified');
  }


  const {trainDataPath, validationDataPath, testDataPath} = data as OriginSampleData;
  const trainFiles = await glob(path.join(trainDataPath, '*.xml'));
  let validationFiles: string[] = [];

  if (validationDataPath) {
    validationFiles = await glob(path.join(validationDataPath, '*.xml'));
    await convertPascol2CocoFileOutput(validationFiles, path.join(trainDataPath, '..', 'validation.json'));
  }

  let testFiles: string[] = [];
  if (testDataPath) {
    testFiles = await glob(path.join(testDataPath, '*.xml'));
    await convertPascol2CocoFileOutput(testFiles, path.join(trainDataPath, '..', 'test.json'));
  }
  
  await convertPascol2CocoFileOutput(trainFiles, path.join(trainDataPath, '..', 'train.json'));
  
  const trainJsonContent = require(path.join(trainDataPath, '..', 'train.json'));
  const categories = trainJsonContent.categories;
  const oneHotMap: any = {};
  categories.forEach((category: any) => {
    oneHotMap[category.name] = category.id
  })
  
  const result: UniformGeneralSampleData = {
    trainData: path.join(trainDataPath, '..', 'train.json'),
    metaData: {
      feature:
        {
          name: 'xs',
          type: 'float32',
          shape: []
        },
      label: {
        name: 'ys',
        type: 'int32',
        shape: [],
        valueMap: oneHotMap
      },
    }
  };

  if (validationFiles.length > 0) {
    result.validationData = path.join(trainDataPath, '..', 'validation.json');
  }
  if (testFiles.length > 0) {
    result.testData = path.join(trainDataPath, '..', 'test.json');
  }

  return result;
}

export default imageDetectronDataAccess;