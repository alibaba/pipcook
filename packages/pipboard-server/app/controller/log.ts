import { Controller } from 'egg';
import * as glob from 'glob-promise';
import * as fs from 'fs-extra';
import * as path from 'path';

import { successRes, failRes } from '../utils/index';

function getModelId(pipelineId: string): string {
  return pipelineId;
}

const workingDir = path.join(process.cwd(), '..');

export default class ProjectController extends Controller {
  public async logs() {
    const { ctx } = this;
    try {
      const logDirs: string[] = await glob(path.join(workingDir, 'pipcook-output', '*', 'log.json'));
      const logs: any[] = [];
      for (let i = 0; i < logDirs.length; i++) {
        const logDir = logDirs[i];
        const log = fs.readJsonSync(logDir);
        const modelId = getModelId(log.pipelineId);
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
              status: component.status,
            };
          })),
          dataset: JSON.stringify(log.latestOriginSampleData),
        });
      }
      return successRes(ctx, {
        logs,
      });
    } catch (err) {
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }

  public async datasets() {
    const { ctx } = this;
    try {
      const dataDirs: string[] = await glob(path.join(workingDir, 'pipcook-output', 'datasets', '*'));
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
          testNumber: annotationsTest.length,
        });
      }

      return successRes(ctx, {
        data: datasets,
      });
    } catch (err) {
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }

  public async models() {
    const { ctx } = this;
    try {
      const modelDirs: string[] = await glob(path.join(workingDir, 'pipcook-output', '*', 'model'));
      const models: any[] = [];
      modelDirs.forEach(modelDir => {
        const modelPathSplit = modelDir.split(path.sep);
        const modelNameSplit = modelPathSplit[modelPathSplit.length - 2];
        // pipecook will arrange logs and models in the same name convention
        let log: any = {};
        try {
          const logPath = path.join(workingDir, 'pipcook-output', modelNameSplit, 'log.json');
          if (fs.pathExistsSync(logPath)) {
            log = fs.readJSONSync(logPath);
          }
        } finally {
          models.push({
            modelId: modelNameSplit, modelName: modelNameSplit,
            evaluation: JSON.stringify(log.latestEvaluateResult),
            startTime: log.startTime,
            endTime: log.endTime,
            type: log.latestModel && log.latestModel.type,
          });
        }
      });
      return successRes(ctx, {
        data: models,
      });
    } catch (err) {
      return failRes(ctx, {
        msg: err.message,
      });
    }
  }
}
