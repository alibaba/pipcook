import { dirname, basename, join } from 'path';
import { createGunzip } from 'zlib';
import { SpawnOptions } from 'child_process';
import tar from 'tar-stream';
import { readFile, ensureDir, pathExists, readJSON, writeJSON, remove, mkdirp, createWriteStream, writeFile } from 'fs-extra';
import { get, post, listen, getFile } from '../utils/request';
import { route } from '../utils/router';
import { tunaMirrorURI } from '../config';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { execNpm, Constants } from '../utils/common';

const { cwd } = process;

interface AppManifest {
  script: string;
  // FIXME(yorkie): share the pipeline type between app and cli.
  pipelines: any[];
  jobIds?: string[];
  executable?: boolean;
  source?: string;
}

interface AppTrainHooks {
  before?: (id: string) => Promise<void>;
  after?: (id: string, jobId: string) => Promise<void>;
}

interface AppInstallHooks {
  before?: (name: string, version: string) => Promise<void>;
  after?: (name: string, version: string) => Promise<void>;
}

interface BuildAppExecutableOpts {
  tuna?: boolean;
}

/**
 * The PipApp project management
 */
export class AppProject {
  public manifest: AppManifest;

  /**
   * private fields for path configs
   */
  private rootPath: string;
  private pipcookPath: string;
  private manifestPath: string;
  private modelRootPath: string;
  private mainScriptPath: string;
  private mainScriptSource: string;

  /**
   * To create a AppProject instance from a main script pathname.
   * @param mainScriptPath The main script pathname
   */
  constructor(mainScriptPath: string) {
    this.mainScriptPath = join(cwd(), mainScriptPath);
    this.rootPath = dirname(this.mainScriptPath);
    this.pipcookPath = join(this.rootPath, '.pipcook');
    this.manifestPath = join(this.pipcookPath, 'manifest.json');
    this.modelRootPath = join(this.pipcookPath, 'models');
  }
  /**
   * Initialize the app project or load from given location.
   */
  async initializeOrLoad() {
    this.mainScriptSource = await readFile(this.mainScriptPath, 'utf8');
    await ensureDir(this.pipcookPath);
    if (await pathExists(this.manifestPath)) {
      this.manifest = await readJSON(this.manifestPath);
    } else {
      this.manifest = {
        script: this.mainScriptPath,
        pipelines: null
      };
    }
  }
  /**
   * Compile the current project, and save manifest locally.
   */
  async compileAndSave(): Promise<void> {
    if (this.manifest.pipelines === null) {
      const { pipelines, executableSource } = await post(`${route.app}/compile`, { src: this.mainScriptSource });
      this.manifest.pipelines = pipelines.map((pipeline: any) => {
        return {
          id: pipeline.id,
          signature: pipeline.signature,
          namespace: pipeline.namespace
        };
      });

      const targetFilename = basename(this.mainScriptPath).replace(/\.ts$/, '');
      await writeFile(`${this.rootPath}/${targetFilename}.ml.js`, executableSource, 'utf8');
      await this.saveManifest();
    }
  }
  /**
   * Train the project via the generated pipelines.
   */
  async train(hooks?: AppTrainHooks): Promise<void> {
    const jobIds = [];
    for await (const pipeline of this.manifest.pipelines) {
      const { id } = pipeline;
      await hooks?.before(id);
      const job = await get(`${route.job}/run`, {
        cwd: cwd(),
        pipelineId: id,
        pyIndex: tunaMirrorURI
      });
      jobIds.push(job.id);
      pipeline.jobId = job.id;
      await hooks?.after(id, job.id);
    }
    // save the jobIds
    // TODO(yorkie): check if currently running?
    this.manifest.jobIds = jobIds;
    await this.saveManifest();
  }
  /**
   * Get the instances for every job.
   */
  async getJobs(): Promise<any[]> {
    return Promise.all(this.manifest.jobIds.map(async (id: string) => {
      return await get(`${route.job}/${id}`);
    }));
  }
  /**
   * Generate the PipApp executable.
   */
  async buildExecutable({ tuna }: BuildAppExecutableOpts) {
    // fetch jobs and verify if it's able to generate exec.
    let jobs = await this.getJobs();
    jobs = jobs.filter((job) => {
      if (job.status === PipelineStatus.RUNNING || job.status === PipelineStatus.INIT) {
        // just throw when there is a job is running or initializing.
        throw new TypeError(`job(${job.id}) is running or initializing, please wait.`);
      } else if (job.status === PipelineStatus.FAIL) {
        // just skip if a job is failed.
        console.warn(`skip job(${job.id}) because failure of "${job.error}"`);
        return false;
      } else if (job.status === PipelineStatus.SUCCESS) {
        // append it for successful job.
        return true;
      }
    });
    if (jobs.length === 0) {
      throw new TypeError('no job is finished.');
    }

    const outputs = await this.downloadOutputs(jobs);
    await this.buildOutputs(outputs, tuna);
    this.manifest.executable = true;

    // save the manifest to sync
    await this.saveManifest();
  }
  /**
   * Ensure the plugins for all generated pipelines.
   */
  async ensureAllPlugins(hooks?: AppInstallHooks): Promise<void> {
    for await (const { id } of this.manifest.pipelines) {
      await this.ensurePluginsByPipeline(id, hooks);
    }
  }
  /**
   * Ensure the plugins for a given pipeline id.
   * @param id the pipeline id.
   */
  private async ensurePluginsByPipeline(id: string, hooks?: AppInstallHooks): Promise<void> {
    return new Promise((resolve, reject) => {
      listen(`${route.pipeline}/${id}/install`, {
        cwd: cwd(),
        pyIndex: tunaMirrorURI
      }, {
        'info': (e: MessageEvent) => {
          const plugin = JSON.parse(e.data);
          hooks?.before(plugin.name, plugin.version);
        },
        'installed': (e: MessageEvent) => {
          const plugin = JSON.parse(e.data);
          hooks?.after(plugin.name, plugin.version);
        },
        'finished': () => {
          resolve();
        },
        'error': (e: MessageEvent) => {
          const installErr = new TypeError(`installed failed with ${e.data}`);
          reject(installErr);
        }
      });
    });
  }
  private async downloadOutputs(jobs: any[]): Promise<string[]> {
    // cleanup the current model root
    await remove(this.modelRootPath);
    return Promise.all(jobs.map(this.downloadSingleOutput));
  }
  private downloadSingleOutput = async (job: any): Promise<string> => {
    const modelPath = join(this.modelRootPath, job.id);
    const extract = tar.extract();
    extract.on('entry', async (header, stream, next) => {
      const dist = join(modelPath, header.name);
      if (header.type === 'directory') {
        await mkdirp(dist);
      } else if (header.type === 'file') {
        stream.pipe(createWriteStream(dist));
      }
      stream.on('end', next);
      stream.resume();
    });

    (await getFile(`${route.job}/${job.id}/output.tar.gz`))
      .pipe(createGunzip())
      .pipe(extract);

    return new Promise((resolve) => {
      extract.on('finish', () => resolve(modelPath));
    });
  }
  /**
   * Build the outputs.
   * @param outputs the outputs directory
   */
  private async buildOutputs(outputs: string[], tuna: boolean): Promise<void> {
    for await (const outputDir of outputs) {
      const opts: SpawnOptions = { cwd: outputDir };
      if (tuna === true) {
        opts.env = {
          BOA_CONDA_INDEX: Constants.BOA_CONDA_INDEX,
          BOA_CONDA_MIRROR: Constants.BOA_CONDA_MIRROR,
          ...process.env
        };
      }
      await execNpm('install', '--production', opts);
    }
  }
  /**
   * Save the manifest
   */
  private async saveManifest(): Promise<void> {
    return writeJSON(this.manifestPath, this.manifest, {
      spaces: 2
    });
  }
}
