import { injectable, BindingScope, service } from '@loopback/core';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  PipelineStatus,
  EvaluateResult,
  compressTarFile,
  UniDataset,
  constants as CoreConstants,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { repository } from '@loopback/repository';
import { PluginRunnable } from '@pipcook/costa';
import { Pipeline } from '../models';
import { Job, JobParam } from '../models';
import { PluginService } from './plugin.service';
import { pluginQueue, execAsync } from '../utils';
import { PluginRepository, PipelineRepository, JobRepository } from '../repositories';
import { PluginInfo, JobRunner } from '../job-runner';
import { Tracer, JobStatusChangeEvent, GenerateOptions } from './interface';

@injectable({ scope: BindingScope.TRANSIENT })
export class JobService {
  @service(PluginService)
  pluginService: PluginService;
  @repository(JobRepository)
  jobRepository: JobRepository;
  @repository(PipelineRepository)
  pipelineRepository: PipelineRepository;
  @repository(PluginRepository)
  pluginRepository: PluginRepository;
  runnableMap: Record<string, PluginRunnable> = {};

  constructor() { }

  // TODO number does not need to ret
  async removeJobById(id: string): Promise<number> {
    const job = await this.jobRepository.findById(id);
    if (job) {
      await Promise.all([
        this.jobRepository.deleteById(job.id),
        fs.remove(`${CoreConstants.PIPCOOK_RUN}/${job.id}`)
      ]);
      return 1;
    }
    return 0;
  }

  async removeJobByEntities(jobs: Job[]): Promise<number> {
    const ids = jobs.map(job => job.id);
    const fsRemoveFutures = [];
    for (const id of ids) {
      fsRemoveFutures.push(fs.remove(`${CoreConstants.PIPCOOK_RUN}/${id}`));
    }
    const deleteFuture = this.jobRepository.deleteAll({
      id: {
        inq: ids
      }
    });
    const results = await Promise.all([
      deleteFuture,
      Promise.all(fsRemoveFutures)
    ]);
    return results[0].count;
  }

  async createJob(pipelineId: string, params: JobParam[] = []): Promise<Job> {
    const specVersion = (await fs.readJSON(path.join(__dirname, '../../package.json'))).version;
    return this.jobRepository.create({
      pipelineId,
      specVersion,
      status: PipelineStatus.INIT,
      params,
      currentIndex: -1,
    });
  }

  /**
   * Generate the output dist for a given job.
   * @param job the job model for output.
   * @param opts the options to used for generating the output.
   */
  async generateOutput(job: Job, opts: GenerateOptions): Promise<void> {
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

  async startJob(job: Job, pipeline: Pipeline, plugins: Partial<Record<PluginTypeI, PluginInfo>>, tracer: Tracer): Promise<void> {
    const runnable = await this.pluginService.createRunnable(job.id, tracer);
    // save the runnable object
    this.runnableMap[job.id] = runnable;
    // update the job status to running
    job.status = PipelineStatus.RUNNING;
    await this.jobRepository.updateById(job.id, job);
    // creater runner
    const runner = new JobRunner({
      job,
      pipeline,
      plugins,
      tracer,
      runnable,
      datasetRoot: this.pluginService.datasetRoot
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
      job.evaluateMap = result;
      job.evaluatePass = result.pass;
      job.endTime = Date.now();
      job.status = PipelineStatus.SUCCESS;

      await this.jobRepository.updateById(job.id, job);
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
        await this.jobRepository.updateById(job.id, job);
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
    const job = await this.jobRepository.findById(id);
    if (job && job.status === PipelineStatus.RUNNING) {
      const runnable = this.runnableMap[id];
      if (runnable) {
        runnable.destroy();
        delete this.runnableMap[id];
      } else {
        console.error(`no runnable found: ${id}`);
      }
      job.status = PipelineStatus.CANCELED;
      await this.jobRepository.updateById(job.id, job);
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

  async runJob(job: Job,
    pipeline: Pipeline,
    plugins: Partial<Record<PluginTypeI, PluginInfo>>,
    tracer: Tracer): Promise<void> {
    job.status = PipelineStatus.PENDING;
    await this.jobRepository.updateById(job.id, job);
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
          if (cb) {
            cb();
          }
        }).catch((err) => {
          reject(err);
          if (cb) {
            cb();
          }
        });
      });
    });
  }
}
