import path from 'path';
import url from 'url';
import { ensureDir, ensureDirSync, pathExists, remove, writeFile, readFile, access, ensureSymlink } from 'fs-extra';
import { spawn, spawnSync, SpawnOptions } from 'child_process';
import { PluginRunnable } from './runnable';
import {
  NpmPackageMetadata,
  NpmPackage,
  RuntimeConfig,
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

/**
 * Plugin Runtime class.
 */
export class PluginRT {
  config: RuntimeConfig;

  constructor(config: RuntimeConfig) {
    this.config = config;
    process.env.NODE_PATH += `:${config.installDir}/node_modules`;
    ensureDirSync(config.installDir);
    ensureDirSync(config.datasetDir);
    ensureDirSync(config.componentDir);
    spawnSync('npm', [ 'init', '-y' ], {
      cwd: config.installDir,
      stdio: 'inherit'
    });
  }
  check(name: string): Promise<boolean> {
    return pathExists(`${this.config.installDir}/node_modules/${name}`);
  }
  getSource(name: string): PluginSource {
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
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  async fetch(name: string): Promise<PluginPackage> {
    const source = this.getSource(name);
    let pkgJSON;
    if (source.from === 'npm') {
      debug(`requesting the url ${source.uri}`);
      const resp = await request(source.uri);
      const meta = JSON.parse(resp) as NpmPackageMetadata;
      pkgJSON = selectLatestPackage(meta);
    } else {
      debug(`linking the url ${source.uri}`);
      pkgJSON = require(source.uri + '/package.json');
    }

    if (!pkgJSON.pipcook) {
      throw new TypeError('Invalid plugin package.json, not found on "pipcook"');
    }
    pkgJSON.pipcook.source = source;
    return pkgJSON as PluginPackage;
  }
  async linkBoa() {
    const boaSrcPath = path.join(__dirname, '../node_modules/@pipcook/boa');
    const boaDstPath = this.config.installDir + '/node_modules/@pipcook/boa';
    await remove(boaDstPath);
    await ensureSymlink(boaSrcPath, boaDstPath);
  }
  /**
   * Install the given plugin by name.
   * @param name the plugin package name
   */
  async install(pkg: PluginPackage): Promise<boolean> {
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
      cwd: this.config.installDir
    });

    debug(`prepare the Python environment for ${pluginStdName}`);
    const envDir = path.join(this.config.installDir, 'conda_envs', pluginStdName);
    await remove(envDir);
    await ensureDir(envDir);

    debug(`install the Python environment for ${pluginStdName}`);
    await writeFile(
      `${envDir}/requirements.txt`,
      this.createPythonRequirements(pluginStdName, pkg.conda),
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
      ]);

    await this.linkBoa();
    return true;
  }
  createPythonRequirements(name: string, config: CondaConfig): string {
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
   * Run the plugin by given arguments.
   * @param name the plugin name
   * @param args the plugin args to run
   */
  async run(pkg: PluginPackage, args?: Record<string, any>): Promise<any> {
    const runnable = new PluginRunnable(this);
    await runnable.bootstrap(pkg.name);
    runnable.start();

    const d = await runnable.read();
    if (d.message.event !== 'pong') {
      throw new TypeError('create plugin failed.');
    }

    if (!args) {
      args = {};
    }
    args.dataDir = path.join(this.config.datasetDir, `${pkg.name}@1.0.0`);
    runnable.write({
      event: 'load',
      params: [ pkg.name, args ]
    });

    const r = await runnable.read();
    if (r.message.event !== 'pong') {
      throw new TypeError('plugin suspend.');
    }
    runnable.destroy();
    console.log('got', d);
  }
}
