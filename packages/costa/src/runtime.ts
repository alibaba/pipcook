import path from 'path';
import url from 'url';
import { ensureDir, ensureDirSync, pathExists, remove, writeFile, readFile, access, ensureSymlink } from 'fs-extra';
import { spawn, spawnSync, SpawnOptions } from 'child_process';
import { PluginRunnable } from './runnable';
import {
  NpmPackageMetadata,
  NpmPackage,
  RuntimeOptions,
  PluginPackage,
  PluginSource,
  CondaConfig
} from './index';

import request from 'request-promise';
import Debug from 'debug';

const debug = Debug('costa.runtime');
const CONDA_CONFIG = path.join(__dirname, '../node_modules/@pipcook/boa/.CONDA_INSTALL_DIR');

function selectLatestPackage(metadata: NpmPackageMetadata): NpmPackage {
  return metadata.versions[metadata['dist-tags'].latest];
}

function spawnAsync(command: string, args?: string[], opts: SpawnOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    opts.stdio = 'inherit';
    opts.detached = false;
    const child = spawn(command, args, opts);
    child.on('close', (code: number) => {
      code === 0 ? resolve() : reject(new TypeError(`invalid code ${code} from ${command}`));
    });
  });
}

function createRequirements(name: string, config: CondaConfig): string {
  let str = '';
  for (let k in config.dependencies) {
    const v = config.dependencies[k];
    if (v === '*') {
      str += `${k}\n`;
    } else {
      str += `${k}==${v}\n`;
    }
  }
  return str;
}

/**
 * The Costa runtime is for scheduling plugins and management.
 */
export class CostaRuntime {
  options: RuntimeOptions;

  /**
   * Create a new Costa runtime by given `RuntimeOptions`.
   * @param opts the runtime options.
   */
  constructor(opts: RuntimeOptions) {
    this.options = opts;
    process.env.NODE_PATH += `:${opts.installDir}/node_modules`;
    ensureDirSync(opts.installDir);
    ensureDirSync(opts.datasetDir);
    ensureDirSync(opts.componentDir);
    spawnSync('npm', [ 'init', '-y' ], {
      cwd: opts.installDir,
      stdio: 'inherit'
    });
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  async fetch(name: string): Promise<PluginPackage> {
    const source = this.getSource(name);
    let pkg: PluginPackage;
    if (source.from === 'npm') {
      debug(`requesting the url ${source.uri}`);
      const resp = await request(source.uri);
      const meta = JSON.parse(resp) as NpmPackageMetadata;
      pkg = selectLatestPackage(meta);
    } else {
      debug(`linking the url ${source.uri}`);
      pkg = require(source.uri + '/package.json');
    }

    if (!pkg.pipcook) {
      throw new TypeError('Invalid plugin package.json, not found on "pipcook"');
    }
    const { installDir } = this.options;
    pkg.pipcook.source = source;
    pkg.pipcook.target = {
      PYTHONPATH: path.join(
        installDir, `conda_envs/${pkg.name}@${pkg.version}`, 'lib/python3.7/site-packages')
    };
    return pkg;
  }
  /**
   * Install the given plugin by name.
   * @param name the plugin package name.
   * @param force install from new anyway.
   */
  async install(pkg: PluginPackage, force = false): Promise<boolean> {
    // check if the pkg is installed
    if ((await this.isInstalled(pkg.name)) && !force) {
      debug(`skip install "${pkg.name}" because it already exists`);
      return true;
    }

    const pluginStdName = `${pkg.name}@${pkg.version}`;
    let pluginAbsName;
    if (pkg.pipcook.source.from === 'npm') {
      pluginAbsName = pluginStdName;
      debug(`install the plugin from npm registry: ${pluginAbsName}`);
    } else {
      pluginAbsName = pkg.pipcook.source.uri;
      debug(`install the plugin from local: ${pluginAbsName}`);
    }
    await spawnAsync('npm', [
      'install', `${pluginAbsName}`, '--save'
    ], {
      cwd: this.options.installDir
    });

    if (pkg.conda?.dependencies) {
      debug(`prepare the Python environment for ${pluginStdName}`);
      const envDir = path.join(this.options.installDir, 'conda_envs', pluginStdName);
      await remove(envDir);
      await ensureDir(envDir);

      debug(`install the Python environment for ${pluginStdName}`);
      await writeFile(
        `${envDir}/requirements.txt`,
        createRequirements(pluginStdName, pkg.conda),
      );

      let python;
      try {
        const condaInstallDir = await readFile(CONDA_CONFIG, 'utf8');
        python = `${condaInstallDir}/bin/python3`;
        await access(python);
      } catch (err) {
        debug(`occuring an error when fetching conda: ${err && err.stack}`);
        throw new Error('Invalid boa/conda installation, please try to install.');
      }

      debug('conda environment is setup correctly, start downloading.');
      await spawnAsync(python, [ '-m', 'venv', envDir ]);
      // TODO(yorkie): check for access(pip3)
      await spawnAsync(`${envDir}/bin/pip3`, 
        [ 'install',
          '-r', `${envDir}/requirements.txt`,
          // TODO(yorkie): make this be optional
          '-i', 'https://pypi.tuna.tsinghua.edu.cn/simple'
        ]
      );
    } else {
      debug(`just skip the Python environment installation.`);
    }
    
    await this.linkBoa();
    return true;
  }
  async uninstall(name: string): Promise<boolean> {
    const pkg = await this.fetch(name);
    if (!await this.isInstalled(pkg.name)) {
      debug(`skip uninstall "${pkg.name}" because it not exists.`);
      return false;
    }

    const pluginStdName = `${pkg.name}@${pkg.version}`;
    await spawnAsync('npm', [
      'uninstall', `${pluginStdName}`, '--save'
    ], {
      cwd: this.options.installDir
    });
    await remove(
      path.join(this.options.installDir, 'conda_envs', pluginStdName));
    return false;
  }
  /**
   * create a runnable.
   */
  async createRunnable(): Promise<PluginRunnable> {
    const runnable = new PluginRunnable(this);
    const pluginNodePath = path.join(this.options.installDir, 'node_modules');
    await this.linkBoa();
    await runnable.bootstrap({
      customEnv: {
        NODE_PATH: `${(process.env.NODE_PATH || '')}:${pluginNodePath}`
      }
    });
    return runnable;
  }
  /**
   * Check the plugin installed
   * @param name 
   */
  private isInstalled(name: string): Promise<boolean> {
    return pathExists(`${this.options.installDir}/node_modules/${name}`);
  }
  /**
   * link the boa dependency.
   */
  private async linkBoa() {
    const boaSrcPath = path.join(__dirname, '../node_modules/@pipcook/boa');
    const boaDstPath = path.join(this.options.installDir, '/node_modules/@pipcook/boa');
    await remove(boaDstPath);
    await ensureSymlink(boaSrcPath, boaDstPath);
    debug(`linked @pipcook/boa to ${boaDstPath} <= ${boaSrcPath}`);
  }
  /**
   * Get the `PluginSource` object by a package name.
   * @param name the package name
   */
  private getSource(name: string): PluginSource {
    const urlObj = url.parse(name);
    const src: PluginSource = {
      from: null,
      name,
      uri: null
    };
    if (path.isAbsolute(name)) {
      src.from = 'fs';
      src.uri = name;
    } else if (name[0] !== '.') {
      src.from = 'npm';
      src.uri = `http://registry.npmjs.com/${name}`;
    } else if (urlObj.protocol == null) {
      src.from = 'fs';
      src.uri = path.join(process.cwd(), name);
    } else {
      throw new TypeError(`Unsupported resolving plugin name: ${name}`);
    }
    return src;
  }
}
