import { dirname, join } from 'path';
import { readFile, ensureDir, pathExists, readJSON, writeJSON } from 'fs-extra';
import { post } from './request';
import { route } from './router';

const { cwd } = process;

interface AppManifest {
  script: string;
  pipelineIds: string[];
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
  private mainScriptPath: string;
  private mainScriptSource: string;

  constructor(mainScriptPath: string) {
    this.mainScriptPath = join(cwd(), mainScriptPath);
    this.rootPath = dirname(this.mainScriptPath);
    this.pipcookPath = join(this.rootPath, '.pipcook');
    this.manifestPath = join(this.pipcookPath, 'manifest.json');
  }
  async initializeOrLoad() {
    this.mainScriptSource = await readFile(this.mainScriptPath, 'utf8');
    await ensureDir(this.pipcookPath);
    if (await pathExists(this.manifestPath)) {
      this.manifest = await readJSON(this.manifestPath);
    } else {
      this.manifest = {
        script: this.mainScriptPath,
        pipelineIds: null
      };
    }
  }
  async compileAndSave(): Promise<void> {
    if (this.manifest.pipelineIds === null) {
      const { pipelines } = await post(`${route.app}/compile`, { src: this.mainScriptSource });
      this.manifest.pipelineIds = pipelines.map((pipeline: any) => pipeline.id);
    }
    await this.saveManifest();
  }
  async saveManifest(): Promise<void> {
    return writeJSON(this.manifestPath, this.manifest, {
      spaces: 2
    });
  }
}