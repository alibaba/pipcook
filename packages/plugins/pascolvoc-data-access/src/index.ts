/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { ArgsType, parseAnnotation, DataAccessType, PascolVocSampleData, MetaData} from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';

/**
 * merge all possible values of labels. Get the map between label and numeric value
 * @param data 
 */
const getLabelMap = async (dataPath: string) => {
  const labelSet = new Set<string>();
  const trainFileNames: string[] = await glob(path.join(dataPath, 'train', '*.xml'));
  for (let j = 0; j < trainFileNames.length; j++) {
    const fileName = trainFileNames[j];
    const imageData: any = await parseAnnotation(fileName);
    labelSet.add(imageData.annotation.object[0].name[0]);
  }
  
  const labelArray = Array.from(labelSet);
  const oneHotMap: {[key: string]: number} = {};
  labelArray.forEach((label: any, index: number) => {
    oneHotMap[label] = index;
  });
  return oneHotMap;
}

/**
 * The plugin used to access data from different sources. It will detect all possible values of labels and 
 * merge them into numeric expressions.
 */
const imagePascolVocDataAccess: DataAccessType = async (args: ArgsType): Promise<PascolVocSampleData> => {
  const {
    dataDir
  } = args;

  const labelMap = await getLabelMap(dataDir);

  const result: PascolVocSampleData = {
    trainData: path.join(dataDir, 'train')
  };
  const validationFileNames: string[] = await glob(path.join(dataDir, 'validation', '*.xml'));
  const testFileNames: string[] = await glob(path.join(dataDir, 'test', '*.xml'));

  if (validationFileNames.length > 0) {
    result.validationData = path.join(dataDir, 'validation');
  }
  if (testFileNames.length > 0) {
    result.testData = path.join(dataDir, 'test');
  }
  result.metaData = {
    labelMap,
    label: {
      shape: [1, Object.keys(labelMap).length]
    }
  }
  
  return result;
}

export default imagePascolVocDataAccess;