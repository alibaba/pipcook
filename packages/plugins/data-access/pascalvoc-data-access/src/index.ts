/**
 * @file This plugin is to access classification image data from different sources. Make sure that
 * the data is conform to expectation.
 */

import { ArgsType, parseAnnotation, DataAccessType, VocDataset, ImageDataLoader, ImageLabel } from '@pipcook/pipcook-core';
import glob from 'glob-promise';
import * as path from 'path';
import * as fs from 'fs';

interface DataPair {
  annotation: string;
  image: string;
  label: ImageLabel;
}

class DataLoader implements ImageDataLoader {
  dataPairs!: DataPair[];
  constructor(dataPairs: DataPair[]) {
    this.dataPairs = dataPairs;
  }

  async len() {
    return this.dataPairs.length;
  }

  async getItem(id: number) {
    return {
      data: this.dataPairs[id].image,
      label: this.dataPairs[id].label
    };
  }
}

/**
 * merge all possible values of labels. Get the map between label and numeric value
 * @param dataPath
 */
const getLabelMap = async (dataPath: string) => {
  const labelSet = new Set<string>();
  const trainFileNames: string[] = await glob(path.join(dataPath, 'train', '*.xml'));
  for (let j = 0; j < trainFileNames.length; j++) {
    const fileName = trainFileNames[j];
    const imageData: any = await parseAnnotation(fileName);
    imageData.annotation.object.forEach((object: any) => {
      labelSet.add(object.name[0]);
    });
  }

  const labelArray = Array.from(labelSet);
  const labelMap: {[key: string]: number} = {};
  labelArray.forEach((label: any, index: number) => {
    labelMap[label] = index;
  });
  return labelMap;
};

const getValidPair = async (dataPath: string, labelMap: {
  [key: string]: number;
}) => {
  const annotationPaths = await glob(path.join(dataPath, '*.xml'));
  const pairs: DataPair[] = [];
  for (let i = 0; i < annotationPaths.length; i++) {
    const fileName = annotationPaths[i];
    const imageData: any = await parseAnnotation(fileName);
    const imageName = imageData.annotation.filename[0];
    if (fs.existsSync(path.join(dataPath, imageName))) {
      imageData.annotation.object.forEach((object: any) => {
        const label: ImageLabel = {
          name: object.name[0],
          categoryId: labelMap[object.name[0]]
        };
        if (object.bndbox) {
          label.bndbox = {
            xmin: Number(object.bndbox[0].xmin[0]),
            xmax: Number(object.bndbox[0].xmax[0]),
            ymin: Number(object.bndbox[0].ymin[0]),
            ymax: Number(object.bndbox[0].ymax[0])
          };
        }
        pairs.push({
          annotation: fileName,
          image: path.join(dataPath, imageName),
          label
        });
      });
    }
  }
  return pairs;
};

/**
 * The plugin used to access data from different sources. It will detect all possible values of labels and
 * merge them into numeric expressions.
 */
const pascalVocDataAccess: DataAccessType = async (args: ArgsType): Promise<VocDataset> => {
  const {
    dataDir
  } = args;

  const labelMap = await getLabelMap(dataDir);

  const trainPair = await getValidPair(path.join(dataDir, 'train'), labelMap);
  const validationPair = await getValidPair(path.join(dataDir, 'validation'), labelMap);
  const testPair = await getValidPair(path.join(dataDir, 'test'), labelMap);

  const trainLoader = new DataLoader(trainPair);
  const validationLoader = new DataLoader(validationPair);
  const testLoader = new DataLoader(testPair);

  const result: VocDataset = {
    metadata: {
      labelMap
    },
    dataStatistics: [],
    validationResult: {
      result: true
    },
    trainXmlPaths: Array.from(new Set(trainPair.map((pair) => pair.annotation))),
    validationXmlPaths: Array.from(new Set(validationPair.map((pair) => pair.annotation))),
    testXmlPaths: Array.from(new Set(testPair.map((pair) => pair.annotation)))
  };

  if (trainPair.length > 0) {
    result.trainLoader = trainLoader;
  }
  if (validationPair.length > 0) {
    result.validationLoader = validationLoader;
  }
  if (testPair.length > 0) {
    result.testLoader = testLoader;
  }

  return result;
};

export default pascalVocDataAccess;
