import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { provide, inject, scope, ScopeEnum } from 'midway';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  PipelineStatus,
  EvaluateResult,
  compressTarFile,
  UniDataset,
  constants as CoreConstants,
  PluginStatus,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { PluginPackage, PluginRunnable } from '@pipcook/costa';
import { PipelineModel, PipelineEntity, QueryOptions } from '../model/pipeline';
import { JobModel, JobEntity } from '../model/job';
import { PluginManager } from './plugin';
import { Tracer, JobStatusChangeEvent } from './trace-manager';
import { pluginQueue } from '../utils/common';
import { PluginInfo, JobRunner } from '../utils/job-runner';
import { UpdateParameter } from '../interface/pipeline';

interface SelectJobsFilter {
  pipelineId?: string;
}

interface GenerateOptions {
  pipeline: PipelineEntity;
  plugins: {
    modelDefine: PluginPackage;
    dataProcess?: PluginPackage;
    datasetProcess?: PluginPackage;
  };
  modelPath: string;
  workingDir: string;
  template: string;
}

function execAsync(cmd: string, opts: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string, stderr: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}

@scope(ScopeEnum.Singleton)
@provide('pipelineService')
export class PipelineService {

  @inject('pluginManager')
  pluginManager: PluginManager;

  runnableMap: Record<string, PluginRunnable> = {};

  async createPipeline(config: PipelineEntity): Promise<PipelineEntity> {
    return PipelineModel.createPipeline(config);
  }

  async getPipeline(idOrName: string): Promise<PipelineEntity> {
    return PipelineModel.getPipeline(idOrName);
  }

  async queryPipelines(opts?: QueryOptions): Promise<PipelineEntity[]> {
    return PipelineModel.queryPipelines(opts);
  }

  async removePipelineById(id: string): Promise<number> {
    return PipelineModel.removePipelineById(id);
  }

  async removePipelines(): Promise<number> {
    return PipelineModel.removePipelines();
  }

  async updatePipelineById(id: string, config: UpdateParameter): Promise<PipelineEntity> {
    return PipelineModel.updatePipelineById(id, config);
  }

  async removeJobById(id: string): Promise<number> {
    const job = await JobModel.getJobById(id);
    if (job) {
      await Promise.all([
        JobModel.removeJobById(job.id),
        fs.remove(`${CoreConstants.PIPCOOK_RUN}/${job.id}`)
      ]);
      return 1;
    }
    return 0;
  }

  async getJobById(id: string): Promise<JobEntity> {
    return JobModel.getJobById(id);
  }

  async saveJob(job: JobEntity): Promise<void> {
    JobModel.saveJob(job);
  }

  async getJobsByPipelineId(pipelineId: string): Promise<JobEntity[]> {
    return JobModel.getJobsByPipelineId(pipelineId);
  }

  async queryJobs(filter: SelectJobsFilter, opts?: QueryOptions): Promise<JobEntity[]> {
    return JobModel.queryJobs(filter, opts);
  }

  async removeJobs(): Promise<number> {
    return JobModel.destroy({ truncate: true });
  }

  async removeJobByModels(jobs: JobEntity[]): Promise<number> {
    const ids = jobs.map(job => job.id);
    const fsRemoveFutures = [];
    for (const id of ids) {
      fsRemoveFutures.push(fs.remove(`${CoreConstants.PIPCOOK_RUN}/${id}`));
    }
    const deleteFuture = JobModel.removeJobByModels(jobs);
    const results = await Promise.all([
      deleteFuture,
      Promise.all(fsRemoveFutures)
    ]);
    return results[0];
  }

  async createJob(pipelineId: string): Promise<JobEntity> {
    const specVersion = (await fs.readJSON(path.join(__dirname, '../../package.json'))).version;
    return JobModel.createJob(pipelineId, specVersion);
  }

  async fetchPlugins(pipeline: PipelineEntity): Promise<Partial<Record<PluginTypeI, PluginInfo>>> {
    const plugins: Partial<Record<PluginTypeI, PluginInfo>> = {};
    const noneInstalledPlugins: string[] = [];
    for (const type of CoreConstants.PLUGINS) {
      if (pipeline[type]) {
        if (!pipeline[`${type}Id`]) {
          noneInstalledPlugins.push(pipeline[type]);
          continue;
        }
        const plugin = await this.pluginManager.findById(pipeline[`${type}Id`]);
        if (plugin && plugin.status === PluginStatus.INSTALLED) {
          // ignore if any plugin not installed, because will throw an error after processing.
          if (noneInstalledPlugins.length === 0) {
            plugins[type] = await {
              plugin: await this.pluginManager.fetchFromInstalledPlugin(plugin.name),
              params: pipeline[`${type}Params`]
            };
          }
        } else {
          noneInstalledPlugins.push(pipeline[type]);
        }
      }
    }
    if (noneInstalledPlugins.length > 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, `these plugins are not installed: ${JSON.stringify(noneInstalledPlugins)}`);
    }
    return plugins;
  }

  /**
   * Generate the output dist for a given job.
   * @param job the job model for output.
   * @param opts the options to used for generating the output.
   */
  async generateOutput(job: JobEntity, opts: GenerateOptions): Promise<void> {
    // start generates the output directory
    const dist = path.join(opts.workingDir, 'output');
    await fs.remove(dist);
    await fs.ensureDir(dist);
    await execAsync('npm init -y', { cwd: dist });

    // post processing the package.json
    const projPackage = await fs.readJSON(dist + '/package.json');
    projPackage.dependencies = {
      [opts.plugins.modelDefine.name]: opts.plugins.modelDefine.version,
    };
    projPackage.scripts = {
      postinstall: 'node boapkg.js'
    };
    if (opts.plugins.dataProcess) {
      projPackage.dependencies[opts.plugins.dataProcess.name] = opts.plugins.dataProcess.version;
    }

    const jsonWriteOpts = { spaces: 2 } as fs.WriteOptions;
    const metadata = {
      pipeline: opts.pipeline,
      output: job,
    };

    await Promise.all([
      // copy base components
      fs.copy(opts.modelPath, dist + '/model'),
      fs.copy(path.join(__dirname, `../../templates/${opts.template}/predict.js`), `${dist}/index.js`),
      fs.copy(path.join(__dirname, '../../templates/boapkg.js'), `${dist}/boapkg.js`),
      // copy logs
      fs.copy(opts.workingDir + '/logs', `${dist}/logs`),
      // write package.json
      fs.outputJSON(dist + '/package.json', projPackage, jsonWriteOpts),
      // write metadata.json
      fs.outputJSON(dist + '/metadata.json', metadata, jsonWriteOpts),
    ]);
    console.info(`trained the model to ${dist}`);

    // packing the output directory.
    await compressTarFile(dist, path.join(opts.workingDir, 'output.tar.gz'));
  }

  async startJob(job: JobEntity, pipeline: PipelineEntity, plugins: Partial<Record<PluginTypeI, PluginInfo>>, tracer: Tracer): Promise<void> {
    const runnable = await this.pluginManager.createRunnable(job.id, tracer);
    // save the runnable object
    this.runnableMap[job.id] = runnable;
    // update the job status to running
    job.status = PipelineStatus.RUNNING;
    await JobModel.saveJob(job);
    // creater runner
    const runner = new JobRunner({
      job,
      pipeline,
      plugins,
      tracer,
      runnable,
      datasetRoot: this.pluginManager.datasetRoot
    });

    runner.dispatchJobEvent(PipelineStatus.RUNNING);
    try {
      // step1: run job
      const {
        evaluateOutput,
        dataset,
        modelPath,
        plugins: {
          modelDefine,
          dataProcess,
          datasetProcess
        }
      } = await runner.run();
      // step2: run finished, save job to database
      const result = await runnable.valueOf(evaluateOutput) as EvaluateResult;
      const datasetVal = await runnable.valueOf(dataset) as UniDataset;
      if (datasetVal?.metadata) {
        job.dataset = JSON.stringify(datasetVal.metadata);
      }
      job.evaluateMap = JSON.stringify(result);
      job.evaluatePass = result.pass;
      job.endTime = Date.now();
      job.status = PipelineStatus.SUCCESS;

      await JobModel.saveJob(job);
      // step3: generate output
      await this.generateOutput(job, {
        modelPath,
        plugins: {
          modelDefine,
          dataProcess,
          datasetProcess
        },
        pipeline,
        workingDir: runnable.workingDir,
        template: 'node' // set node by default
      });
      // step4: all done
      runner.dispatchJobEvent(PipelineStatus.SUCCESS);
    } catch (err) {
      if (!runnable.canceled) {
        job.status = PipelineStatus.FAIL;
        job.error = err.message;
        await JobModel.saveJob(job);
        runner.dispatchJobEvent(PipelineStatus.FAIL);
      } else {
        runner.dispatchJobEvent(PipelineStatus.CANCELED);
      }
      throw err;
    } finally {
      await runnable.destroy();
      delete this.runnableMap[job.id];
    }
  }

  async stopJob(id: string): Promise<void> {
    const job = await JobModel.getJobById(id);
    if (job && job.status === PipelineStatus.RUNNING) {
      const runnable = this.runnableMap[id];
      if (runnable) {
        runnable.destroy();
        delete this.runnableMap[id];
      } else {
        console.error(`no runnable found: ${id}`);
      }
      job.status = PipelineStatus.CANCELED;
      await JobModel.saveJob(job);
    } else {
      throw createHttpError(HttpStatus.BAD_REQUEST, 'job is not running');
    }
  }

  /**
   * Get the output tar pathname by job id.
   * @param id the job id
   */
  getOutputTarByJobId(id: string): string {
    return path.join(CoreConstants.PIPCOOK_RUN, id, 'output.tar.gz');
  }

  async getLogById(id: string): Promise<string[]> {
    const stdout = path.join(CoreConstants.PIPCOOK_RUN, id, 'logs/stdout.log');
    const stderr = path.join(CoreConstants.PIPCOOK_RUN, id, 'logs/stderr.log');
    if (await fs.pathExists(stdout) && await fs.pathExists(stderr)) {
      return [
        await fs.readFile(stderr, 'utf8'),
        await fs.readFile(stdout, 'utf8')
      ];
    } else {
      throw createHttpError(HttpStatus.NOT_FOUND, 'log not found');
    }
  }

  async runJob(job: JobEntity,
               pipeline: PipelineEntity,
               plugins: Partial<Record<PluginTypeI, PluginInfo>>,
               tracer: Tracer): Promise<void> {
    job.status = PipelineStatus.PENDING;
    await this.saveJob(job);
    return new Promise((resolve, reject) => {
      let queueLength = pluginQueue.length;
      const queueReporter = () => {
        queueLength--;
        if (queueLength > 0) {
          tracer.dispatch(new JobStatusChangeEvent(PipelineStatus.PENDING, undefined, undefined, queueLength));
        }
      };
      if (queueLength > 0) {
        pluginQueue.on('success', queueReporter);
        tracer.dispatch(new JobStatusChangeEvent(PipelineStatus.PENDING, undefined, undefined, queueLength));
      }
      pluginQueue.push((cb) => {
        pluginQueue.removeListener('success', queueReporter);
        this.startJob(job, pipeline, plugins, tracer).then(() => {
          resolve();
          cb();
        }).catch((err) => {
          reject(err);
          cb();
        });
      });
    });
  }
}
