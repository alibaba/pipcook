import { ArgsType, ModelDeployType, downloadZip, unZipData, getModelDir, compressTarFile, UniformGeneralSampleData, PipcookModel } from '@pipcook/pipcook-core';
import { Python } from '@pipcook/pipcook-python-node';
import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs-extra';

const OSS = require('ali-oss');
const shell = require('shelljs');
const uuidv1 = require('uuid/v1');
const glob = require('glob-promise');


const imageClassEasDeploy: ModelDeployType = async (data: UniformGeneralSampleData, model: PipcookModel, args: ArgsType): Promise<any> => {
  let {
    easName = '',
    cpus = 2, 
    memory = 4000, 
    ossConfig = {}, 
    ossDir = '', 
    gpu, 
    resource, 
    eascmd, 
    envPackName, 
    envScriptName,
    pipelineId,
    updateOrCreate
  } = args || {};

  await Python.scope('image-deploy', async (python: any) => {
    python.runshell('pip install tensorflowjs==1.5.2');
    await python.reconnect();
  });

  const kerasActivation = 
  await glob(path.join(process.cwd(), 'pipcook_venv', 'lib', '*', 'site-packages', 'tensorflow_core', 'python', 'keras', 'activations.py'));

  kerasActivation.forEach((kerasPath: string) => {
    fs.copyFileSync(path.join(__dirname, 'assets', 'activations.py'), kerasPath);
  });

  await Python.scope('image-deploy', async (python: any) => {
    python.runshell(`tensorflowjs_converter --input_format=tfjs_layers_model --output_format=keras ${path.join(getModelDir(pipelineId), 'model.json')} ${path.join(getModelDir(pipelineId), 'model.h5')}`);
  });

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
    const envUrl = 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/eas-pack/image-classification/';
    const zipPath = path.join(packagePath, easName, 'ENV.zip');
    await downloadZip(envUrl + envPackName, zipPath);
    await unZipData(zipPath, path.join(packagePath, easName));
    fs.removeSync(zipPath);
    // write app.json
    const metadata: any = {
      cpu: cpus,
      memory: memory,
      "rpc.keepalive": 60000,
      region: "shanghai" 
    };

    if (gpu) {
      metadata.gpu = gpu;
    }
    if (resource) {
      metadata.resource = resource;
    }

    const app = {
      processor_path: 'http://' + ossConfig.bucket + '.' + ossConfig.region + '.aliyuncs.com/' + ossDir + '/' + easName + '.tar.gz',
      processor_entry: './app.py',
      processor_type: "python",
      name: easName,
      generate_token: "true",
      metadata
    };
    fs.outputFileSync(path.join(packagePath, easName, 'app.json'), JSON.stringify(app));

    // copy model
    const modelPath = path.join(getModelDir(pipelineId), 'model.h5');
    fs.copySync(modelPath, path.join(packagePath, easName, 'model.h5'));

    // copy app.py
    fs.copyFileSync(path.join(__dirname, 'assets', 'app.py'), path.join(packagePath, easName, 'app.py'));

    // save label map
    fs.writeFileSync(path.join(packagePath, easName, 'label.json'), JSON.stringify(data.metaData.label.valueMap));

    console.log('uploading..., please wait');
    // package the whole content
    await compressTarFile(path.join(packagePath, easName), path.join(packagePath, easName + '.tar.gz'));

    // upload to oss
    
    await client.put(path.join(ossDir, easName + '.tar.gz'), path.join(packagePath, easName + '.tar.gz'), { timeout: 60000000 });

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
      // TODO: catch err?
    }
   
  }
};

export default imageClassEasDeploy;


