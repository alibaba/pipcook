import path from 'path';
import url from 'url';
import { ensureDir, ensureDirSync, pathExists, remove, writeFile, readFile, access, ensureSymlink } from 'fs-extra';
import { spawn, SpawnOptions } from 'child_process';
import { PluginRunnable, BootstrapArg } from './runnable';
import {
  NpmPackageMetadata,
  NpmPackage,
  NpmPackageNameSchema,
  RuntimeOptions,
  PluginPackage,
  PluginSource,
  CondaConfig
} from './index';

import request from 'request-promise';
import Debug from 'debug';

const debug = Debug('costa.runtime');
const CONDA_CONFIG = path.join(__dirname, '../node_modules/@pipcook/boa/.CONDA_INSTALL_DIR');

function selectNpmPackage(metadata: NpmPackageMetadata, source: PluginSource): NpmPackage {
  const { version } = source?.schema;
  if (version === 'beta') {
    if (metadata['dist-tags'].beta == null) {
      throw TypeError(`the package "${source.name}" has no beta version.`);
    }
    return metadata.versions[metadata['dist-tags'].beta];
  }
  if (version === 'latest') {
    return metadata.versions[metadata['dist-tags'].latest];
  }
  if (version) {
    // TODO(Yorkie): support version range just like (1.0.x, ^1.0.0, ...)
    return metadata.versions[source?.schema.version];
  }
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

function createRequirements(name: string, config: CondaConfig): string[] {
  const deps = [];
  for (let k in config.dependencies) {
    const v = config.dependencies[k];
    if (v === '*') {
      deps.push(k);
    } else if (v.startsWith('git+https://') === true) {
      deps.push(v);
    } else {
      deps.push(`${k}==${v}`);
    }
  }
  return deps;
}

export { PluginPackage } from './index';
export { RunnableResponse } from './runnable';
export {
  PluginRunnable,
  BootstrapArg
};

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
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   * @param cwd the current working directory.
   */
  async fetch(name: string, cwd?: string): Promise<PluginPackage> {
    const source = this.getSource(name, cwd || process.cwd());
    let pkg: PluginPackage;
    if (source.from === 'npm') {
      debug(`requesting the url ${source.uri}...`);
      const resp = await request(source.uri);
      const meta = JSON.parse(resp) as NpmPackageMetadata;
      pkg = selectNpmPackage(meta, source);
    } else {
      debug(`linking the url ${source.uri}`);
      pkg = require(`${source.uri}/package.json`);
    }

    try {
      this.validPackage(pkg);
      this.assignPackage(pkg, source);
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        console.warn('skip the valid package and assign because NODE_ENV is set to "test".');
      } else {
        throw err;
      }
    }
    return pkg;
  }
  /**
   * Install the given plugin by name.
   * @param pkg the plugin package.
   * @param force install from new anyway.
   * @param pyIndex the index mirror to install python packages.
   */
  async install(pkg: PluginPackage, force = false, pyIndex?: string): Promise<boolean> {
    // check if the pkg is installed
    if ((await this.isInstalled(pkg.name)) && !force) {
      debug(`skip install "${pkg.name}" because it already exists`);
      return true;
    }

    let boaSrcPath = path.join(__dirname, '../node_modules/@pipcook/boa');
    if (!await pathExists(boaSrcPath)) {
      boaSrcPath = path.join(__dirname, '../../boa');
    }
    if (!await pathExists(boaSrcPath)) {
      throw new TypeError('costa is not installed correctly, please try init again');
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

    const npmExecOpts = { cwd: this.options.installDir };
    if (!await pathExists(`${this.options.installDir}/package.json`)) {
      // if not init for plugin directory, just run `npm init` and install boa firstly.
      await spawnAsync('npm', [ 'init', '-y' ], npmExecOpts);
      await spawnAsync('npm', [ 'install', boaSrcPath, '-E' ], npmExecOpts);
    }
    await spawnAsync('npm', [ 'install', `${pluginAbsName}`, '-E', '--production' ], npmExecOpts);

    if (pkg.conda?.dependencies) {
      debug(`prepare the Python environment for ${pluginStdName}`);
      const envDir = path.join(this.options.installDir, 'conda_envs', pluginStdName);
      await remove(envDir);
      await ensureDir(envDir);

      debug(`install the Python environment for ${pluginStdName}`);
      const requirements = createRequirements(pluginStdName, pkg.conda);
      // just sync the copy to requirements.txt
      await writeFile(
        `${envDir}/requirements.txt`,
        requirements.join('\n')
      );

      let python;
      try {
        const condaInstallDir = await readFile(`${boaSrcPath}/.CONDA_INSTALL_DIR`, 'utf8');
        python = `${condaInstallDir}/bin/python3`;
        await access(python);
      } catch (err) {
        debug(`occuring an error when fetching conda: ${err && err.stack}`);
        throw new Error('Invalid boa/conda installation, please try to install.');
      }

      debug('conda environment is setup correctly, start downloading.');
      await spawnAsync(python, [ '-m', 'venv', envDir ]);
      // TODO(yorkie): check for access(pip3)

      for (let name of requirements) {
        debug(`installing python package ${name}`);
        let args = [ 'install', name ];
        if (pyIndex) {
          args = args.concat([ '-i', pyIndex ]);
        }
        args = args.concat(['--default-timeout=1000'])
        await spawnAsync(`${envDir}/bin/pip3`, args);
      }
    } else {
      debug(`just skip the Python environment installation.`);
    }
    
    return true;
  }
  /**
   * Uninstall the given plugin by name.
   * @param name the plugin package name.
   */
  async uninstall(name: string): Promise<boolean> {
    if (!await this.isInstalled(name)) {
      debug(`skip uninstall "${name}" because it not exists.`);
      return false;
    }
    await remove(path.join(this.options.installDir, 'node_modules', name));
    return true;
  }
  /**
   * create a runnable.
   */
  async createRunnable(args?: BootstrapArg): Promise<PluginRunnable> {
    if (args?.customEnv) {
      throw new TypeError('"customEnv" is not allowed here.');
    }
    const runnable = new PluginRunnable(this, args.id);
    const pluginNodePath = path.join(this.options.installDir, 'node_modules');
    await runnable.bootstrap({
      customEnv: {
        NODE_PATH: `${(process.env.NODE_PATH || '')}:${pluginNodePath}`
      },
      ...args
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
   * Create the `NpmPackageNameSchema` object by a package name.
   * @param fullname the fullname of a package, lile "@pipcook/test@1.x"
   * @returns the created `NpmPackageNameSchema` object.
   */
  private getNameSchema(fullname: string): NpmPackageNameSchema {
    let schema = new NpmPackageNameSchema();
    if (fullname[0] === '@') {
      const scopeEnds = fullname.search('/');
      if (scopeEnds === -1) {
        throw new TypeError(`invalid package name: ${fullname}`);
      }
      schema.scope = fullname.substr(0, scopeEnds);
      fullname = fullname.substr(scopeEnds + 1);
    }
    const [ name, version ] = fullname.split('@');
    schema.name = name;
    schema.version = version ? version : null;
    return schema;
  }
  /**
   * Get the `PluginSource` object by a package name.
   * @param name the package name.
   * @param cwd the current working dir.
   */
  private getSource(name: string, cwd: string): PluginSource {
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
      src.schema = this.getNameSchema(name);
      src.from = 'npm';
      src.uri = `http://registry.npmjs.com/${src.schema.packageName}`;
    } else if (urlObj.protocol == null) {
      src.from = 'fs';
      src.uri = path.join(cwd, name);
    } else {
      throw new TypeError(`Unsupported resolving plugin name: ${name}`);
    }
    return src;
  }
  /**
   * Valid the package.
   * @param pkg the plugin package.
   */
  private validPackage(pkg: PluginPackage): void {
    if (!pkg.pipcook) {
      throw new TypeError('Invalid plugin package.json, not found on "pipcook"');
    }
  }
  /**
   * Assign some fields to package.
   * @param pkg the plugin package.
   */
  private assignPackage(pkg: PluginPackage, source: PluginSource): PluginPackage {
    const { installDir } = this.options;
    pkg.pipcook.source = source;
    pkg.pipcook.target = {
      PYTHONPATH: path.join(
        installDir, `conda_envs/${pkg.name}@${pkg.version}`, 'lib/python3.7/site-packages'),
      DESTPATH: path.join(
        installDir, `node_modules/${pkg.name}@${pkg.version}`)
    };
    return pkg;
  }
}
