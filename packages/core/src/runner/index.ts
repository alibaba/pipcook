/**
 * @file The core part of Pipcook. Essentially the Pipcook runner will include all the
 * information required for run-time machine learning execution.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as uuid from 'uuid';
import childProcess from 'child_process';

import config from '../config';
import { PipcookComponentResult } from '../types/component';
import { UniDataset } from '../types/data/common';
import { UniModel } from '../types/model';
import { DeploymentResult, EvaluateResult } from '../types/other';
import { getLog, createPipeline, assignLatestResult, linkComponents, assignFailures } from './helper';
import { logStartExecution, logError, logComplete } from '../utils/logger';
import { PLUGINS } from '../constants/plugins';
import { RunConfigI } from '../types/config';

import {
  DataCollect,
  DataAccess,
  DataProcess,
  ModelLoad,
  ModelDefine,
  ModelTrain,
  ModelEvaluate,
} from '../components/lifecycle';
import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELDEFINE,
  MODELTRAIN,
  MODELEVALUATE,
} from '../constants/plugins';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

/**
 * @class: This is the core part of Pipcook. It's responsible for running Pipcook components,
 * @public pipelineVersion: we will record current Pipcook version, in case we will change protocol later
 * @public logDir: directory for log
 * @public pipelineId: id for this time's execution
 * @public latestSampleData: up to date train data in the pipeline
 * @public latestModel: up to date model data in the pipeline
 * @public latestDeploymentResult: up to date deployment data in the pipeline
 * @public updatedType: the return type of lastest plugin in the pipeline
 * @public components: all components executed in the pipeline
 * @public currentIndex: lastest indes of components executed
 * @public error: if there are any error
 * @public latestEvaluateResult: evaluation result
 * @public startTime: start time of pipeline
 * @public endTime: end time of pipeline
 * @public status: status of current pipeline
 * 
 */
export class PipcookRunner {
  pipelineVersion: string = config.version;
  logDir: string|null = null;
  pipelineId: string|null = null;
  latestSampleData: UniDataset |null = null;
  latestModel: UniModel |null = null;
  latestEvaluateResult: EvaluateResult | null = null;
  latestDeploymentResult: DeploymentResult | null = null;

  updatedType: string | null = null;
  components: PipcookComponentResult[] = [];
  currentIndex = -1;
  error: any = null;

  startTime = 0;
  endTime = 0;

  status: 'running' | 'error' | 'success' = 'running';

  /**
   * Constructor, user need to specify pipeline name when init
   */
  constructor() {
    this.pipelineId = uuid.v1();
    this.logDir = path.join(process.cwd(), 'pipcook-output', this.pipelineId);
    fs.ensureDirSync(this.logDir);
    fs.ensureDirSync(path.join(this.logDir, 'model'));
    fs.ensureDirSync(path.join(this.logDir, 'data'));
    fs.ensureDirSync(path.join(this.logDir, 'deploy'));
    fs.ensureDirSync(path.join(process.cwd(), '.temp', this.pipelineId));
  }

  /**
   * save function, save both model and any log info
   */
  savePipcook = async () => {
    // store Pipcook log
    const json = JSON.stringify(getLog(this), getCircularReplacer(), 2);
    await fs.outputFile(path.join(this.logDir as string, 'log.json'), json);
  }

  init = async (components: PipcookComponentResult[]) => {
    this.startTime = Date.now();
    logStartExecution(this);
    if (!components || components.length <= 0) {
      throw new Error('Please specify at least one plugin to run!');
    }

    linkComponents(components);
    this.components = components;
  }

  handleError = async (error: Error, components: PipcookComponentResult[]) => {
    this.status = 'error';
    // error handle
    this.endTime = Date.now();
    assignFailures(components);
    this.error = error.message;
    await this.savePipcook();
    logError('Component ' + this.components[this.currentIndex].type + ' error: ');
    logError(error);
  }

  handleSuccess = async () => {
    // end the pipeline
    this.status = 'success';
    this.endTime = Date.now();
    await this.savePipcook();
    await this.deploy();
    logComplete(); 
  }

  /**
   * run components
   * @param components: components to be executed
   */
  run = async (components: PipcookComponentResult[], successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) => {
    await this.init(components);
    
    // create pipeline of plugins
    const pipeline = createPipeline(components, this, 'normal', saveModelCallback);
    pipeline.subscribe((result: any) => {
      // success handle
      components[components.length - 1].status = 'success';
      assignLatestResult(this.updatedType as string, result, this);
    }, async (error: Error) => {
      await this.handleError(error, components);
      if (errorCallback) {
        await errorCallback(error, this);
      }
    }, async () => {
      await this.handleSuccess();
      if (successCallback) {
        await successCallback(this);
      }
    });
  }

  /**
   * run config file
   */
  runConfig = async (configPath: string, successCallback?: Function, errorCallback?: Function, saveModelCallback?: Function) => {
    const config: RunConfigI = fs.readJsonSync(configPath);
    const components: PipcookComponentResult[] = [];
    PLUGINS.forEach((pluginType) => {
      if (config.plugins[pluginType] && config.plugins[pluginType].package) {
        const pluginName = config.plugins[pluginType].package;
        const params = config.plugins[pluginType].params || {};
        const version = process.env.npm_package_version;

        let pluginModule, factoryMethod;
        try {
          pluginModule = require(pluginName).default;
        } catch (err) {
          pluginModule = require(path.join(process.cwd(), pluginName)).default;
        }
        switch (pluginType) {
          case DATACOLLECT:
            factoryMethod = DataCollect;
            break;
          case DATAACCESS:
            factoryMethod = DataAccess;
            break;
          case DATAPROCESS:
            factoryMethod = DataProcess;
            break;
          case MODELLOAD:
            factoryMethod = ModelLoad;
            break;
          case MODELDEFINE:
            factoryMethod = ModelDefine;
            break;
          case MODELTRAIN:
            factoryMethod = ModelTrain;
            break;
          case MODELEVALUATE:
            factoryMethod = ModelEvaluate;
            break;
        }
        const component = factoryMethod(pluginModule, params);
        component.version = version;
        component.package = config.plugins[pluginType].package;
        components.push(component);
      }
    });
    this.run(components, successCallback, errorCallback, saveModelCallback);
  }

  /**
   * for whatever plugins, they will need
   *  - deploy plugin
   *  - model define plugin
   *  - data process plugin if required 
   */
  deploy = async () => {
    const deployDir = path.join(this.logDir, 'deploy');
    await fs.copy(path.join(this.logDir, 'model'), path.join(deployDir, 'model'));
    await fs.copy(path.join(this.logDir, 'log.json'), path.join(deployDir, 'log.json'));
    await fs.copy(path.join(__dirname, '..', 'assets', 'predict.js'), path.join(deployDir, 'main.js'))
    let dependencies: any = {};
    const dataProcessCom = this.components.find(e => e.type === DATAPROCESS);
    const analyzeCom = async (component: PipcookComponentResult) => {
      let pluginPath;
      try {
        pluginPath = require.resolve(component.package);
      } catch (err) {
        pluginPath = require.resolve(path.join(process.cwd(), component.package));
      }
      pluginPath = path.join(pluginPath, '..', '..');
      await fs.copy(pluginPath, path.join(deployDir, component.type));
      const packageJson = await fs.readJSON(path.join(pluginPath, 'package.json'));
      return packageJson.dependencies;
    }
    if (dataProcessCom) {
      dependencies = await analyzeCom(dataProcessCom);
    }
    const modelDefineCom = this.components.find(e => e.type === MODELDEFINE || e.type === MODELLOAD);
    const dependenciesTemp = await analyzeCom(modelDefineCom);
    dependencies = {
      ...dependencies,
      ...dependenciesTemp
    }
    const packageJson = await fs.readJSON(path.join(__dirname, '..', 'assets', 'template-package.json'));
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies
    };
    await fs.writeJSON(path.join(deployDir, 'package.json'), packageJson, {spaces: 2});
  }
}
