import { ModelDeployType, IDeployInfo, ArgsType } from '@pipcook/pipcook-core';
import { v1 as uuidv1 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';

const easModelDeploy: ModelDeployType = 
  async (args: ArgsType, deployInfo: IDeployInfo): Promise<any> => {
    const tempDir = path.join('.temp', uuidv1());
    await fs.ensureDir(tempDir);
    try {
      let dependencies: any = {};
      if (deployInfo.dataProcessPlugin) {
        let dataProcessPath = require.resolve(deployInfo.dataProcessPlugin.package);
        dataProcessPath = path.join(dataProcessPath, '..', '..');
        await fs.copy(dataProcessPath, path.join(tempDir, 'dataProcess'));
        const packageJson = await fs.readJSON(path.join(dataProcessPath, 'package.json'));
        dependencies = packageJson.dependencies;
      }
      
    } finally {
      // await fs.remove(tempDir);
    }
  };

export default easModelDeploy;
