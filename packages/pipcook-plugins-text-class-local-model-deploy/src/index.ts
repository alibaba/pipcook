import {transformCsv, DataProcessType, ArgsType, ModelDeployType, DataAccessType} from '@pipcook/pipcook-core';
import * as path from 'path';
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');

const textClassLocalModelDeploy: ModelDeployType = async (args:ArgsType): Promise<any> => {
  const {
    data, dataAccess, model, dataProcess
  } = args || {};
  if (!data) {
    return;
  }
  const trainDataPath = path.join(process.cwd(), '.temp', uuidv1());
  try {
    const trainData: string[] = [];
    for (let i = 0; i < data.length; i++) {
      trainData.push(transformCsv(data[i]) + ',notset');
      fs.outputFileSync(path.join(trainDataPath, 'train.csv'), trainData.join('\n'));
    }

    let result: any = {
      trainDataPath: path.join(trainDataPath, 'train.csv'),
    }

    const dataAccessPlugin = <DataAccessType>dataAccess.plugin;
    result = await dataAccessPlugin(result, dataAccess.params);

    if (dataProcess) {
      const dataProcessPlugin = <DataProcessType>dataProcess.plugin;
      result = await dataProcessPlugin(result, dataProcess.params);
    }

    const prediction: any[] = [];

    await result.trainData.forEachAsync((e: any) => {
      prediction.push(model.predict(e.xs))
    })
    return prediction;
  } finally {
    fs.removeSync(trainDataPath);
  }
  
}

export default textClassLocalModelDeploy;

