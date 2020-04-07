import { ArgsType, ModelDeployType, downloadZip } from '@pipcook/pipcook-core';
import * as path from 'path';
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');

const detectionDetectronModelDeploy: ModelDeployType = async (dataHolder: any, modelHolder: any, args: ArgsType): Promise<any> => {
  const {
    data = '', model = ''
  } = args || {};
  if (!data) {
    return;
  }
  const trainDataPath = path.join(process.cwd(), '.temp', uuidv1());
  try {
    const images: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const picName = uuidv1() + '.png'; 
      await downloadZip(data[i], path.join(trainDataPath, 'images', picName));
      images.push(path.join(trainDataPath, 'images', picName));
    }
    const prediction = await model.predict(images);
    return prediction;
  } finally {
    fs.removeSync(trainDataPath);
  }
  
};

export default detectionDetectronModelDeploy;

