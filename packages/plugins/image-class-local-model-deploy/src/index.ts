import {DataProcessType, ArgsType, ModelDeployType, downloadZip, createAnnotationFile, DataAccessType} from '@pipcook/pipcook-core';
import * as path from 'path';
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');

const imageClassLocalModelDeploy: ModelDeployType = async (dataHolder: any, modelHolder: any, args: ArgsType): Promise<any> => {
  const {
    data, dataAccess, model, dataProcess
  } = args || {};
  if (!data) {
    return;
  }
  const trainDataPath = path.join(process.cwd(), '.temp', uuidv1());
  try {
    for (let i = 0; i < data.length; i++) {
      const picName = uuidv1() + '.png'; 
      await downloadZip(data[i], path.join(trainDataPath, 'images', picName));
      createAnnotationFile(path.join(trainDataPath, 'annotations', 'train'), picName, picName, 'not set');
    }

    let result: any = {
      trainDataPath: path.join(trainDataPath, 'annotations', 'train'),
    }

    const dataAccessPlugin = dataAccess.plugin as DataAccessType;
    result = await dataAccessPlugin(result, dataAccess.params);

    if (dataProcess) {
      const dataProcessPlugin = dataProcess.plugin as DataProcessType;
      result = await dataProcessPlugin(result, dataProcess.params);
    }
    
    let xData = result.trainData.map((data: any) => data.xs).batch(result.trainData.size);
    xData = await xData.toArray();
    xData = xData[0];

    const prediction = await model.predict(xData);

    return prediction;
  } finally {
    fs.removeSync(trainDataPath);
  }
  
}

export default imageClassLocalModelDeploy;

