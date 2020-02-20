/**
 * @file This file contains all required functionality for the pipcook server. Basically the pipcook server is used to 
 * serve the pipcook-board.
 */

import glob from 'glob-promise';
import * as path from 'path'
import {PipcookRunner} from '../core/core';
import {runPredict} from '../core/core-helper';
import {PipcookModel} from '../types/model';
import {logError} from '../utils/logger';
import {ModelLoadType} from '../types/plugins';

const opn = require('better-opn');
const fs = require('fs-extra');

/**
 * get a server instance. Disable the logger of server
 */
export function getServer() {
  const fastify = require('fastify')({ logger: false });
  return fastify;
}

/**
 * start the sever. it will listen at 7778 port. if the environment is local, a default browser will be opened.
 * @param fastify : fastify server instance
 */
export function startServer(fastify: any) {
  fastify.listen(7778, '0.0.0.0' ,function (err: Error, address: string) {
    if (err) {
      fastify.log.error(err)
    }
    console.log('The prediction server has been started. You could open http://localhost:7778/index# locally to start!')
    opn('http://localhost:7778/index#');
  });
}

/**
 * This is for /models endpoint. The server will reply related info about all models in logs.
 * @param fastify 
 */
export function serverModel(fastify: any) {
  fastify.get('/models', async (req: any, reply: any) => {
    try {
      const modelDirs: string[] = await glob(path.join(process.cwd(),'pipcook-output', '*', 'model'));
      const models: any[] = [];
      modelDirs.forEach((modelDir) => {
        const modelPathSplit = modelDir.split(path.sep);
        const modelNameSplit = modelPathSplit[modelPathSplit.length - 2];
        // pipecook will arrange logs and models in the same name convention
        let log: any = {};
        try {
          if(fs.pathExistsSync(path.join(process.cwd(), 'pipcook-output', modelNameSplit, `log.json`))) {
            log = require(path.join(process.cwd(), 'pipcook-output', modelNameSplit ,`log.json`));
          }
        } finally {}
        models.push({
          modelId: modelNameSplit,  modelName: modelNameSplit,
          evaluation: JSON.stringify(log.latestEvaluateResult),
          startTime: log.startTime,
          endTime: log.endTime,
          type: log.latestModel && log.latestModel.type
        });
      });
      return {
        status: true,
        data: models
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        err
      }
    }
  }); 
}

/**
 * This is for /datasets endpoint. The server will reply related info about current dataset. The datasets are stored in log dir.
 * @param fastify 
 */
export function serveDataset(fastify: any) {
  fastify.get('/datasets', async (req: any, reply: any) => {
    try {
      const dataDirs: string[] = await glob(path.join(process.cwd(),'pipcook-output', 'datasets' ,'*'));
      const datasets: any[] = [];
      for (let i = 0; i < dataDirs.length; i++) {
        const dataDir = dataDirs[i];
        const dataDirSplit = dataDir.split(path.sep);
        const annotationsTrain = await glob(path.join(dataDir, 'annotations', 'train', '*.xml'));
        const annotationsValidation = await glob(path.join(dataDir, 'annotations', 'validation', '*.xml'));
        const annotationsTest = await glob(path.join(dataDir, 'annotations', 'test', '*.xml'));
        datasets.push({
          datasetName: dataDirSplit[dataDirSplit.length - 1],
          trainNumber: annotationsTrain.length,
          validationNumber: annotationsValidation.length,
          testNumber: annotationsTest.length
        });
      }

      return {
        status: true,
        data: datasets
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        err
      }
    }
  }); 
}

/**
 * A helper function to get the model id from pipeline id
 * @param pipelineId : id of pipeline
 */
async function getModelId(pipelineId: string) {
  return pipelineId;
}

/**
 * this if for /log endpoint. The server will reply related info about logs.
 * @param fastify 
 */
export function serveLog(fastify: any) {
  fastify.get('/log', async (req: any, reply: any) => {
    try {
      const logDirs: string[] = await glob(path.join(process.cwd(),'pipcook-output','*' ,'log.json'));
      const logs: any[] = [];
      for (let i = 0; i < logDirs.length; i++) {
        const logDir = logDirs[i];
        const log = require(logDir);
        const modelId = await getModelId(log.pipelineId)
        logs.push({
          modelId,
          pipelineId: log.pipelineId,
          pipelineVersion: log.pipelineVersion,
          evaluation: JSON.stringify(log.latestEvaluateResult),
          startTime: log.startTime,
          endTime: log.endTime,
          type: log.latestModel && log.latestModel.type,
          components: JSON.stringify(log.components.map((component: any) => {
            return {
              type: component.type,
              status: component.status
            }
          })),
          dataset: JSON.stringify(log.latestOriginSampleData)
        })
      }
      return {
        status: true,
        data: logs
      }
    } catch (err) {
      console.log(err);
      return {
        status: false,
        err
      }
    }
  }); 
}

/**
 * server static assets of pipcook-board. This is the front-end resources after built by webpack
 * @param fastify
 */
function serveStatic(fastify: any) {
  fastify.register(require('fastify-static'), {
    root: path.join(__dirname, '..', '..','dist', 'assets', 'build'),
  });

  fastify.get('/index', function (req: any, reply: any) {
    reply.sendFile('index.html');
  });
}

/**
 * this is used to start the server and pipcook board when a pipeline is started.
 * @param runner 
 */
export async function serveRunner(runner: PipcookRunner) {
  runner.fastify = require('fastify')({ logger: false });
  // serve static assets and three endpoints
  serveStatic(runner.fastify);
  serverModel(runner.fastify);
  serveDataset(runner.fastify);
  serveLog(runner.fastify);

  // if this parameter is true, that means we need to load the model first.
  if (runner.onlyPredict) {
    const modelComponent = runner.components.find((e) => e.type === 'modelLoad');
    if (!modelComponent) {
      logError('Please provide plugin to load model');
      return;
    }
  
    const modelPlugin = <ModelLoadType>modelComponent.plugin;
    if (!(modelComponent.params && modelComponent.params.modelId)) {
      logError('Please provide model id in prediction pipeline');
      return;
    }
    const model = await modelPlugin(null, {
      modelId: modelComponent.params.modelId
    });
    runner.latestModel = model;
  }


  // only use predict endpoint when the parameter: predictServer is true
  if (runner.predictServer || runner.onlyPredict) {
    runner.fastify.post('/predict', async (request: any, reply: any) => {
      const result = await runPredict(runner, request);
      return result;
    });
  } 

  // This is for /status endpoint. Used when the pipeline is running and the front-end needs to know its status.
  runner.fastify.get('/status', async (req: any, reply: any) => {
    const model = <PipcookModel>runner.latestModel;
    return {
      status: runner.status,
      type: model && model.type,
      version: runner.pipelineVersion,
      startTime: runner.startTime,
      id: runner.pipelineId
    };
  })

  return new Promise((resolve, reject) => {
    runner.fastify.listen(7778, '0.0.0.0' , (err: Error, address: string) => {
      if (err) {
        runner.fastify.log.error(err)
      }
      runner.fastify.log.info(`server listening on ${address}`);
      console.log('The prediction server has been started. You could open http://localhost:7778 locally to check status!');
      if (!runner.onlyPredict) {
        opn('http://localhost:7778');
      }
      resolve();
    });
  })
}

export async function shutdown(runner: PipcookRunner) {
  if (runner.fastify && !runner.predictServer) {
    await runner.fastify.close();
  }
  fs.removeSync(path.join(process.cwd(), '.temp', runner.pipelineId));
  if (!runner.predictServer) {
    process.exit(0);
  } 
}

/**
 * start pipcook-board by pipcook-cli
 */
export function startBoard() {
  const fastify = getServer();
  serveStatic(fastify);
  serverModel(fastify);
  serveDataset(fastify);
  serveLog(fastify);
  startServer(fastify);
}