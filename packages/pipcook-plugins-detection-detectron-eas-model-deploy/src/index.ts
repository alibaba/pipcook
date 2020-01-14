import {ArgsType, ModelDeployType, downloadZip, unZipData, getModelDir} from '@pipcook/pipcook-core';
import * as path from 'path';
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');
import * as assert from 'assert';
const targz = require('tar.gz');
const ncp = require('ncp').ncp;
const OSS = require('ali-oss');
var shell = require('shelljs');

const detectionDetectronModelDeploy: ModelDeployType = async (args: ArgsType): Promise<any> => {
  const {
    data='', model='', modelId='', easName='', cpus=8, memory=12000, instances=1, ossConfig={}, ossDir=''
  } = args || {};
  if (!data) {
    return;
  }
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
      processor_entry: 'http://' + ossConfig.bucket +'.'+ossConfig.region+'.aliyuncs.com/'+ossDir+'/'+easName+'.tar.gz',
      processor_type: "python",
      name: easName,
      generate_token: true,
      metadata: {
        cpu: cpus,
        memory: memory,
        "rpc.keepalive": 60000
      }
    }
    fs.writeFileSync(path.join(packagePath, easName, 'app.json'), JSON.stringify(app));
    // copy config
    const configPath = '' // TODO
    ncp(configPath, path.join(packagePath, easName), function (err) {
      if (err) {
        throw err;
      }
    })
    // copy model
    const modelPath = modelId ? path.join(getModelDir(modelId), 'model_final.pth'):path.join(process.cwd(), '.temp', 'output', 'model_final.pth');
    fs.ensureDirSync(path.join(packagePath, easName, 'output'))
    fs.copyFile(modelPath, path.join(packagePath, easName, 'output', 'model_final.pth'), (err) => {
      if (err) throw err;
    });
    // copy app.py
    await downloadZip(envUrl + 'app.py', path.join(packagePath, easName, 'app.py'));

    // save label map
    fs.writeFileSync(path.join(packagePath, easName, 'label.json'), JSON.stringify(data.metaData.label.valueMap));
    // package the whole content
    var read = targz().createReadStream(path.join(packagePath, easName));
    var write = fs.createWriteStream(path.join(packagePath, easName + '.tar.gz'));
    read.pipe(write);
    // upload to oss
    const client = OSS(ossConfig)
    await client.put(path.join(ossDir, easName + '.tar.gz'), path.join(packagePath, easName + '.tar.gz'));
    // create service
    assert.ok(shell.which('eascmd'), 'please install eascmd first');
    if (shell.exec('eascmd create' + path.join(packagePath, easName, 'app.json')).code !== 0) {
      shell.echo('Error: create service' + easName + 'failed');
      shell.exit(1);
    }
  } finally {
    fs.removeSync(packagePath);
  }
}

export default detectionDetectronModelDeploy;

