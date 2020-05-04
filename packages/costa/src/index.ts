import * as uuid from 'uuid';
import path from 'path';
import url from 'url';
import { ensureDir, ensureDirSync, pathExists, ensureSymlink, remove, writeFile, readFile, access } from 'fs-extra';
import { spawn, spawnSync, fork, ChildProcess, SpawnOptions } from 'child_process';
import { PluginProto, PluginOperator, PluginMessage } from './proto';

import request from 'request-promise';
import Debug from 'debug';

const debug = Debug('costa');
const CONDA_CONFIG = path.join(__dirname, '../../node_modules/@pipcook/boa/.CONDA_INSTALL_DIR');

/**
 * The config for Plugin Runtime.
 */
interface RuntimeConfig {
  /**
   * The directory to install plugins.
   */
  installDir: string;
  /**
   * The directory for dataset storage.
   */
  datasetDir: string;
  /**
   * The directory for component instance.
   */
  componentDir: string;
}

interface PluginSource {
  from: 'fs' | 'npm' | null;
  name: string;
  uri: string | null;
}

interface CondaConfig {
  python?: string;
  dependencies?: Record<string, string>;
}

interface PluginPackage {
  name: string;
  version: string;
  main: string;
  description?: string;
  pipcook: {
    datatype: 'vision' | 'text' | 'table';
    source: PluginSource;
  };
  conda?: CondaConfig;
}

interface NpmPackage extends PluginPackage {
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
  };
}

interface NpmPackageMetadata {
  _id: string;
  _rev: string;
  name: string;
  'dist-tags': {
    beta: string;
    latest: string;
  };
  versions: Record<string, NpmPackage>;
}

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

class PluginRunnable {
  private id: string = uuid.v4();
  private rt: PluginRT;
  private handle: ChildProcess = null;
  private readable: Function | null;

  constructor(rt: PluginRT) {
    this.rt = rt;
  }
  /**
   * Bootstrap for specific plugin.
   * @param name the plguin name.
   */
  async bootstrap(name: string): Promise<void> {
    const { installDir, componentDir } = this.rt.config;
    const compPath = path.join(componentDir, this.id);
    const nameSchema = path.parse(name);

    await ensureDir(compPath);
    await ensureDir(compPath + '/node_modules');
    if (nameSchema.dir) {
      await ensureDir(compPath + `/node_modules/${nameSchema.dir}`);
    }

    // prepare boa and miniconda environment
    await ensureSymlink(
      path.join(installDir, 'node_modules', name),
      compPath + `/node_modules/${name}`);

    this.handle = fork(__dirname + '/client', [], {
      stdio: 'inherit',
      cwd: compPath
    });
    this.handle.on('message', this.handleMessage.bind(this));
    this.handle.once('disconnect', this.afterDestroy.bind(this));
  }
  async destroy(): Promise<void> {
    this.write({ event: 'destroy' });
  }
  async afterDestroy(): Promise<void> {
    debug(`the runnable(${this.id}) has been destroyed.`);
    await remove(path.join(this.rt.config.componentDir, this.id));
  }
  send(code: number, msg?: PluginMessage): boolean {
    const data = PluginProto.stringify(code, msg);
    return this.handle.send(data);
  }
  start(): boolean {
    return this.send(PluginOperator.START);
  }
  write(data: PluginMessage): boolean {
    return this.send(PluginOperator.WRITE, data);
  }
  async read(): Promise<PluginProto> {
    return new Promise((resolve) => {
      this.readable = resolve;
    });
  }
  handleMessage(msg: string) {
    const proto = PluginProto.parse(msg) as PluginProto;
    if (typeof this.readable === 'function') {
      this.readable(proto);
    }
  }
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
    return;
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
  /**
   * Install the given plugin by name.
   * @param name the plugin package name
   */
  async install(pkg: PluginPackage): Promise<boolean> {
    const pluginAbsName = `${pkg.name}@${pkg.version}`;
    debug(`install the plugin ${pluginAbsName}`);
    await spawnAsync('npm', [
      'install', `${pluginAbsName}`, '--save'
    ], {
      cwd: this.config.installDir
    });

    debug(`prepare the Python environment for ${pluginAbsName}`);
    const envDir = path.join(this.config.installDir, 'conda_envs', pluginAbsName);
    await remove(envDir);
    await ensureDir(envDir);

    debug(`install the Python environment for ${pluginAbsName}`);
    await writeFile(
      envDir + '/env.yml', 
      this.createCondaEnv(pluginAbsName, pkg.conda),
    );

    let conda;
    try {
      const condaInstallDir = await readFile(CONDA_CONFIG, 'utf8');
      conda = condaInstallDir + '/bin/conda';
      await access(conda);
    } catch (err) {
      debug(`occuring an error when fetching conda: ${err && err.stack}`);
      throw new Error('Invalid boa/conda installation, please try to install.');
    }

    debug('conda environment is setup correctly, start downloading.');
    await spawnAsync(conda,
      [ 'env', 'create',
        '-f', `${envDir}/env.yml`,
        '-p', `${envDir}` ]
    );
    return true;
  }
  createCondaEnv(name: string, config: CondaConfig): string {
    let ymlstr = '';
    const appendDep = (n: string, v: string) => ymlstr += `  - ${n}=${v}\n`;

    ymlstr += `name: "${name}"\n`;
    ymlstr += `dependencies:\n`;
    appendDep('python', config.python);
    for (let k in config.dependencies) {
      appendDep(k, config.dependencies[k]);
    }
    return ymlstr;
  }
  /**
   * Run the plugin by given arguments.
   * @param name the plugin name
   * @param args the plugin args to run
   */
  async run(name: string, args?: Record<string, any>): Promise<any> {
    const runnable = new PluginRunnable(this);
    await runnable.bootstrap(name);
    runnable.start();

    const d = await runnable.read();
    if (d.message.event !== 'pong') {
      throw new TypeError('create plugin failed.');
    }

    if (!args) {
      args = {};
    }
    args.dataDir = path.join(this.config.datasetDir, `${name}@1.0.0`);
    runnable.write({
      event: 'load',
      params: [ name, args ]
    });

    const r = await runnable.read();
    if (r.message.event !== 'pong') {
      throw new TypeError('plugin suspend.');
    }
    runnable.destroy();
    console.log('got', d);
  }
}
