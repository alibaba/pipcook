/**
 * @file The core part of Pipcook. Essentially the Pipcook runner will include all the
 * information required for run-time machine learning execution.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
const uuidv1 = require('uuid/v1');

import config from '../config';
import { PipcookComponentResult } from '../types/component';
import { OriginSampleData, UniformSampleData } from '../types/data';
import { PipcookModel } from '../types/model';
import { DeploymentResult, EvaluateResult } from '../types/other';
import { getLog, createPipeline, assignLatestResult, linkComponents, assignFailures } from './core-helper';
import { logStartExecution, logError, logComplete } from '../utils/logger';

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
 * @public latestOriginSampleData: lastest origin sample data flow in pipeline
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
  latestOriginSampleData: OriginSampleData | OriginSampleData[] |null = null;
  latestSampleData: UniformSampleData |null = null;
  latestModel: PipcookModel | PipcookModel[] |null = null;
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
    this.pipelineId = uuidv1();
    this.logDir = path.join(process.cwd(), 'pipcook-output', this.pipelineId);
    fs.ensureDirSync(this.logDir);
    fs.ensureDirSync(path.join(this.logDir, 'model'));
    fs.ensureDirSync(path.join(process.cwd(), '.temp', this.pipelineId));
  }

  /**
   * save function, save both model and any log info
   */
  savePipcook = async () => {
    // store Pipcook log
    const json = JSON.stringify(getLog(this), getCircularReplacer());
    fs.outputFileSync(path.join(this.logDir as string, 'log.json'), json);
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
}
