import {ArgsType, ModelDeployType, downloadZip, unZipData, compressTarFile, UniformGeneralSampleData, PipcookModel} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';

const OSS = require('ali-oss');
const shell = require('shelljs');
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');


const detectionDetectronModelDeploy: ModelDeployType = async (data: UniformGeneralSampleData, model: PipcookModel, args: ArgsType): Promise<any> => {
  let {
    easName='',
    cpus=2,
    memory=4000,
    ossConfig={},
    ossDir='',
    gpu,
    resource,
    eascmd,
    envPackName,
    envScriptName,
    updateOrCreate
  } = args || {};

  if (!envPackName) {
    envPackName = 'ENV.zip';
  }
  if (!envScriptName) {
    envScriptName = 'app.py';
  }
  if (!updateOrCreate) {
    updateOrCreate = 'create';
  }
  const packagePath = path.join(process.cwd(), '.temp', uuidv1());
  fs.ensureDirSync(path.join(packagePath, easName));
  const client = OSS(ossConfig);
  try {
    // get detectron env
    const envUrl = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/eas-pack/'
    const zipPath = path.join(packagePath, easName, 'ENV.zip')
    await downloadZip(envUrl + envPackName, zipPath);
    await unZipData(zipPath, path.join(packagePath, easName))
    fs.removeSync(zipPath)
    // write app.json
    const metadata: any = {
      cpu: cpus,
      memory: memory,
      "rpc.keepalive": 60000
    }

    if (gpu) {
      metadata.gpu = gpu;
    }
    if (resource) {
      metadata.resource = resource;
    }

    const app = {
      processor_path: 'http://' + ossConfig.bucket +'.'+ossConfig.region+'.aliyuncs.com/'+ossDir+'/'+easName+'.tar.gz',
      processor_entry: './app.py',
      processor_type: "python",
      name: easName,
      generate_token: "true",
      metadata
    }
    fs.outputFileSync(path.join(packagePath, easName, 'app.json'), JSON.stringify(app));
    // copy config
    const configPath = model.extraParams.detectronConfigPath
    fs.copySync(configPath, path.join(packagePath, easName, 'config'));

    // copy model
    const modelPath = model.extraParams.modelPath;
    fs.copySync(modelPath, path.join(packagePath, easName, 'output', 'model_final.pth'));

    // copy app.py
    await downloadZip(envUrl + envScriptName, path.join(packagePath, easName, 'app.py'));

    // save label map
    fs.writeFileSync(path.join(packagePath, easName, 'label.json'), JSON.stringify(data.metaData.label.valueMap));

    // package the whole content
    await compressTarFile(path.join(packagePath, easName), path.join(packagePath, easName + '.tar.gz'));

    // upload to oss
    
    await client.put(path.join(ossDir, easName + '.tar.gz'), path.join(packagePath, easName + '.tar.gz'), {timeout: 60000000});

    // create service
    if (!eascmd) {
      assert.ok(shell.which('eascmd'), 'please install eascmd first');
    }
    
    if (updateOrCreate === 'create') {
      if (shell.exec(`${eascmd || 'eascmd'} create ` + path.join(packagePath, easName, 'app.json')).code !== 0) {
        shell.echo('Error: create service' + easName + 'failed');
      }
    } else if (updateOrCreate === 'update') {
      if (shell.exec(`${eascmd || 'eascmd'} modify shanghai/${easName} -s ` + path.join(packagePath, easName, 'app.json')).code !== 0) {
        shell.echo('Error: create service' + easName + 'failed');
      }
    }
  } finally {
    fs.removeSync(packagePath);
    try {
      await client.delete(path.join(ossDir, easName + '.tar.gz'));
    } catch (err) {
      // TODO: cache error?
    }
  }
}

export default detectionDetectronModelDeploy;

