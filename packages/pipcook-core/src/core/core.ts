/**
 * @file The core part of Pipcook. Essentially the Pipcook runner will include all the
 * information required for run-time machine learning execution.
 */

import config from '../config';
import * as fs from 'fs-extra';
import * as path from 'path';
import {PipcookComponentResult} from '../types/component';
import {OriginSampleData, UniformSampleData} from '../types/data';
import {PipcookModel} from '../types/model';
import {DeploymentResult, EvaluateResult} from '../types/other';
import {getLog, createPipeline, assignLatestResult, linkComponents, assignFailures} from './core-helper';
import {logStartExecution, logError, logComplete} from '../utils/logger';
import {serveRunner} from '../board/board';

/**
 * @class: This is the core part of Pipcook. It's responsible for running Pipcook components,
 * @public pipelineName: name of current pipeline
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
 * @private fastify: fastify server instance
 * @private predictServer: if run prediction server
 * @private onlyPredict: if the pipeline is not for training, but just for prediction
 */
export class PipcookRunner {
  pipelineName: string = '';
  pipelineVersion: string = config.version;
  logDir: string|null = null;
  pipelineId: string|null = null;
  latestOriginSampleData:  OriginSampleData | OriginSampleData[] |null = null;
  latestSampleData: UniformSampleData | UniformSampleData[] |null = null;
  latestModel: PipcookModel | PipcookModel[] |null = null;
  latestEvaluateResult: EvaluateResult | null = null;
  latestDeploymentResult: DeploymentResult | null = null;

  fastify: any = {};

  updatedType: string | null = null;
  components:PipcookComponentResult[] = [];
  currentIndex: number = -1;
  error: any = null;

  startTime: number = 0;
  endTime: number = 0;

  predictServer = false;
  onlyPredict = false;

  status: 'running' | 'error' | 'success' = 'running';

  /**
   * Constructor, user need to specify pipeline name when init
   * @param pipelineName: pipeline name
   */
  constructor(pipelineName: string, options: any) {
    if (pipelineName) {
      this.pipelineName = pipelineName;
    }
    this.logDir = path.join(process.cwd(), '.pipcook-log');
    fs.ensureDirSync(this.logDir);
    if (options && options.predictServer) {
      this.predictServer = true;
    }
    if (options && options.onlyPredict) {
      this.onlyPredict = true;
    }
    fs.ensureDirSync(path.join(this.logDir, 'models'));
  }

  /**
   * save function, save both model and any log info
   */
  savePipcook = async () => {
    // store Pipcook log
    const json = JSON.stringify(getLog(this));
    fs.outputFileSync(path.join(<string>this.logDir, 'logs' ,this.pipelineId+'.json'), json);
    fs.removeSync(path.join(process.cwd(), '.temp'));
  }

  /**
   * start the server when the pipeline is started.
   */
  startServer = async () => {
    const server = await await serveRunner(this);
    return server;
  }

  /**
   * run components
   * @param components: components to be executed
   */
  run = async (components:PipcookComponentResult[]) => {
    fs.removeSync(path.join(process.cwd(), '.temp')); 

    this.startTime = Date.now()
    this.pipelineId = 'pipcook-pipeline-' + this.startTime;
    logStartExecution(this);
    if (!components || components.length <= 0) {
      throw new Error('Please specify at least one plugin to run!');
    }

    linkComponents(components);
    this.components = components;

    await this.startServer();

    if (this.onlyPredict) {
      return;
    }

    // create pipeline of plugins
    const pipeline = createPipeline(components, this);
    pipeline.subscribe((result: any) => {
      // success handle
      components[components.length - 1].status = 'success';
      assignLatestResult(<string>this.updatedType, result, this);
    }, async (error: any) => {
      this.status = 'error';
      // error handle
      this.endTime = Date.now();
      assignFailures(components);
      this.error = error && error.toString();
      await this.savePipcook();
      logError('Component ' + this.components[this.currentIndex].type + ' error: ');
      logError(error);
      console.log(error);
    }, async (complete: any) => {
      // end the pipeline
      this.status = 'success';
      this.endTime = Date.now();
      await this.savePipcook();
      logComplete(); 
      console.log('The prediction server has been started. You could open http://localhost:7778 locally to check status!')
    });
  }
}