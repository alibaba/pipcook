import { transformCsv, DataProcessType, ArgsType, ModelDeployType, DataAccessType } from '@pipcook/pipcook-core';
import * as path from 'path';
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');

const textClassLocalModelDeploy: ModelDeployType = async (dataHolder: any, modelHolder: any, args: ArgsType): Promise<any> => {
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
      trainDataPath: path.join(trainDataPath, 'train.csv')
    };

    const dataAccessPlugin = dataAccess.plugin as DataAccessType;
    result = await dataAccessPlugin(result, dataAccess.params);

    if (dataProcess) {
      const dataProcessPlugin = dataProcess.plugin as DataProcessType;
      result = await dataProcessPlugin(result, dataProcess.params);
    }

    const predictionPromise: any[] = [];

    await result.trainData.forEachAsync((e: any) => {
      predictionPromise.push(model.predict(e.xs));
    });

    const prediction: any[] = [];
    for (let i = 0; i < predictionPromise.length; i++){
      const currentPredict = await predictionPromise[i];
      prediction.push(currentPredict);
    }
    return prediction;
  } finally {
    fs.removeSync(trainDataPath);
  }
  
};

export default textClassLocalModelDeploy;

