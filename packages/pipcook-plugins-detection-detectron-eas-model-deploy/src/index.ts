import {ArgsType, ModelDeployType, downloadZip, unZipData, compressTarFile, UniformGeneralSampleData, PipcookModel} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as assert from 'assert';

const OSS = require('ali-oss');
const shell = require('shelljs');
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');


const detectionDetectronModelDeploy: ModelDeployType = async (data: UniformGeneralSampleData, model: PipcookModel, args: ArgsType): Promise<any> => {
  const {
    easName='', cpus=2, memory=4000, ossConfig={}, ossDir=''
  } = args || {};
  const packagePath = path.join(process.cwd(), '.temp', uuidv1());
  fs.ensureDirSync(path.join(packagePath, easName))
  try {
    // get detectron env
    const envUrl = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/eas-pack/'
    const zipPath = path.join(packagePath, easName, 'ENV.zip')
    await downloadZip(envUrl + 'ENV.zip', zipPath);
    await unZipData(zipPath, path.join(packagePath, easName))
    fs.removeSync(zipPath)
    // write app.json
    const app = {
      processor_path: 'http://' + ossConfig.bucket +'.'+ossConfig.region+'.aliyuncs.com/'+ossDir+'/'+easName+'.tar.gz',
      processor_entry: './app.py',
      processor_type: "python",
      name: easName,
      generate_token: "true",
      metadata: {
        cpu: cpus,
        memory: memory,
        "rpc.keepalive": 60000
      }
    }
    fs.outputFileSync(path.join(packagePath, easName, 'app.json'), JSON.stringify(app));
    // copy config
    const configPath = model.extraParams.detectronConfigPath
    fs.copySync(configPath, path.join(packagePath, easName, 'config'));

    // copy model
    const modelPath = model.extraParams.modelPath;
    fs.copySync(modelPath, path.join(packagePath, easName, 'output', 'model_final.pth'));

    // copy app.py
    await downloadZip(envUrl + 'app.py', path.join(packagePath, easName, 'app.py'));

    // save label map
    fs.writeFileSync(path.join(packagePath, easName, 'label.json'), JSON.stringify(data.metaData.label.valueMap));

    // package the whole content
    await compressTarFile(path.join(packagePath, easName), path.join(packagePath, easName + '.tar.gz'));

    // upload to oss
    const client = OSS(ossConfig);
    await client.put(path.join(ossDir, easName + '.tar.gz'), path.join(packagePath, easName + '.tar.gz'), {timeout: 60000000});

    // create service
    assert.ok(shell.which('eascmd'), 'please install eascmd first');
    if (shell.exec('eascmd create ' + path.join(packagePath, easName, 'app.json')).code !== 0) {
      shell.echo('Error: create service' + easName + 'failed');
      shell.exit(1);
    }
  } finally {
    fs.removeSync(packagePath);
  }
}

export default detectionDetectronModelDeploy;

