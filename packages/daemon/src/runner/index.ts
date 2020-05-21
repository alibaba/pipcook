/**
 * @file The core part of Pipcook. Essentially the Pipcook runner will include all the
 * information required for run-time machine learning execution.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v1 as uuidv1 } from 'uuid';

import config from './config';
import {
  PipcookComponentResult,
  PipcookComponentOutput,
  PipcookComponentResultStatus,
  UniDataset,
  UniModel,
  EvaluateResult,
  PipObject,
  constants,
  PipelineStatus,
  PipelineDB,
  PipelineDBParams,
  OutputType
} from '@pipcook/pipcook-core';
import { getLog, createPipeline, assignLatestResult, linkComponents, markFailures } from './helper';
import { logStartExecution, logError, logComplete } from './logger';
import { LifeCycleTypes } from './lifecycle';
import { PIPCOOK_DEPENDENCIES, compressTarFile } from '@pipcook/pipcook-utils';

const { PLUGINS, DATAPROCESS, MODELLOAD, MODELDEFINE } = constants;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
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
 * @public updatedType: the return type of lastest plugin in the pipeline
 * @public components: all components executed in the pipeline
 * @public currentIndex: lastest indes of components executed
 * @public error: if there are any error
 * @public evaluateMap: evaluation result
 * @public startTime: start time of pipeline
 * @public endTime: end time of pipeline
 * @public status: status of current pipeline
 *
 */
export class PipcookRunner {
  pipelineVersion: string = config.version;
  logDir: string | null = null;
  pipelineId: string | null = null;
  jobId: string | null = null;
  latestSampleData: UniDataset | null = null;
  latestModel: UniModel | null = null;
  evaluateMap: EvaluateResult | null = null;
  evaluatePass: boolean | null = null;

  updatedType: OutputType = null;
  components: PipcookComponentResult[] = [];
  currentIndex = -1;
  error: string = null;

  startTime = 0;
  endTime = 0;

  status: PipelineStatus;

  /**
   * Constructor, user need to specify pipeline name when init
   */
  constructor(pipelineId?: string, jobId?: string) {
    this.pipelineId = pipelineId || uuidv1();
    this.jobId = jobId || uuidv1();
    this.logDir = path.join(os.homedir(), '.pipcook', 'logs', this.jobId);
    this.status = PipelineStatus.INIT;
    fs.ensureDirSync(path.join(this.logDir, 'model'));
    fs.ensureDirSync(path.join(this.logDir, 'data'));
    fs.ensureDirSync(path.join(this.logDir, 'deploy'));
  }

  /**
   * save function, save both model and any log info
   */
  savePipcook = async () => {
    // store Pipcook log
    const json = JSON.stringify(getLog(this), getCircularReplacer(), 2);
    await fs.outputFile(path.join(this.logDir, 'log.json'), json);
  }

  init = async (components: PipcookComponentResult[]) => {
    this.startTime = Date.now();
    logStartExecution(this);
    if (!components || components.length <= 0) {
      throw new Error('Please specify at least one plugin to run!');
    }

    linkComponents(components);
    this.components = components;

    process
      .on('unhandledRejection', async (reason) => {
        await this.handleError(reason as Error, this.components);
        this.notifyStatus();
        process.exit();
      })
      .on('uncaughtException', async (err) => {
        await this.handleError(err, this.components);
        this.notifyStatus();
        process.exit();
      });
  }

  handleError = async (error: Error, components: PipcookComponentResult[]) => {
    this.status = PipelineStatus.FAIL;
    // error handle
    this.endTime = Date.now();
    this.components = markFailures(components);
    this.error = error.message;
    await this.savePipcook();
    logError('Component ' + this.components[this.currentIndex].type + ' error: ');
    logError(error);
  }

  handleSuccess = async () => {
    // end the pipeline
    this.status = PipelineStatus.SUCCESS;
    this.endTime = Date.now();
    await this.savePipcook();
    await this.deploy();
    logComplete();
  }

  notifyStatus = () => {
    const runnerStatus: any = {
      status: this.status,
      currentIndex: this.currentIndex
    };
    if (this.evaluateMap) {
      runnerStatus.evaluateMap = JSON.stringify(this.evaluateMap);
    }
    if (this.evaluatePass !== undefined) {
      runnerStatus.evaluatePass = this.evaluatePass;
    }
    if (this.endTime) {
      runnerStatus.endTime = this.endTime;
    }
    if (this.error) {
      runnerStatus.error = JSON.stringify(this.error);
    }
    if (this.latestSampleData && this.latestSampleData.metadata) {
      runnerStatus.metadata = JSON.stringify(this.latestSampleData.metadata);
    }
    process.send({
      type: 'pipeline-status',
      data: runnerStatus
    });
  }

  /**
   * run components
   * @param components: components to be executed
   */
  run = async (components: PipcookComponentResult[]) => {
    this.status = PipelineStatus.RUNNING;
    await this.init(components);

    // create pipeline of plugins
    const pipeline = createPipeline(components, this, 'normal');
    pipeline.subscribe((result: PipcookComponentOutput) => {
      // success handle
      components[components.length - 1].status = PipcookComponentResultStatus.Success;
      assignLatestResult(this.updatedType, result, this);
    }, async (error: Error) => {
      await this.handleError(error, components);
      this.notifyStatus();
    }, async () => {
      await this.handleSuccess();
      this.notifyStatus();
    });
  }

  /**
   * run config
   */
  runConfig = async (config: PipelineDB) => {
    const components: PipcookComponentResult[] = [];
    PLUGINS.forEach((pluginType) => {
      if (config[pluginType] && LifeCycleTypes[pluginType]) {
        const pluginName = config[pluginType];
        const params = JSON.parse(config[(pluginType + 'Params') as PipelineDBParams] || '{}');
        const version = process.env.npm_package_version;
        let pluginModule;
        try {
          pluginModule = require(path.join(PIPCOOK_DEPENDENCIES, 'node_modules', pluginName)).default;
        } catch (err) {
          try {
            pluginModule = require(pluginName).default;
          } catch (err) {
            try {
              pluginModule = require(path.join(process.cwd(), pluginName)).default;
            } catch (err) {
              this.handleError(err, this.components);
              this.notifyStatus();
              process.exit();
            }
          }
        }
        const factoryMethod = LifeCycleTypes[pluginType];
        const component = factoryMethod(pluginModule, params);
        component.version = version;
        component.package = config[pluginType];
        components.push(component);
      }
    });
    this.run(components);
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
    await fs.copy(path.join(__dirname, '..', '..', 'assets', 'predict.js'), path.join(deployDir, 'main.js'));
    let dependencies: PipObject = {};
    const dataProcessCom = this.components.find((e) => e.type === DATAPROCESS);
    const analyzeCom = async (component: PipcookComponentResult): Promise<PipObject> => {
      let pluginPath;
      try {
        pluginPath = require.resolve(path.join(PIPCOOK_DEPENDENCIES, 'node_modules', component.package));
      } catch (err) {
        try {
          pluginPath = require.resolve(component.package);
        } catch (err) {
          pluginPath = require.resolve(path.join(process.cwd(), component.package));
        }
      }
      pluginPath = path.join(pluginPath, '..', '..');
      await fs.copy(pluginPath, path.join(deployDir, component.type));
      const packageJson = await fs.readJSON(path.join(pluginPath, 'package.json'));
      return packageJson.dependencies;
    };
    if (dataProcessCom) {
      dependencies = await analyzeCom(dataProcessCom);
    }
    const modelDefineCom = this.components.find((e) => e.type === MODELDEFINE || e.type === MODELLOAD);
    const dependenciesTemp = await analyzeCom(modelDefineCom);
    dependencies = {
      ...dependencies,
      ...dependenciesTemp
    };
    const packageJson = await fs.readJSON(path.join(__dirname, '..', '..', 'assets', 'template-package.json'));
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies
    };
    await fs.writeJSON(path.join(deployDir, 'package.json'), packageJson, { spaces: 2 });
    await compressTarFile(deployDir, path.join(this.logDir, 'deploy.tar.gz'));
  }
}
