import { ensureDirSync } from "fs-extra";
import { spawnSync, fork, ChildProcess } from 'child_process';
import { PluginProto, PluginOperator, PluginMessage } from './proto';
import request from 'request-promise';
import Debug from 'debug';
const debug = Debug('core.pluginrt');

interface RuntimeConfig {
  installDir: string;
}

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  main: string;
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

class PluginRunnable {
  private handle: ChildProcess;
  private readable: Function | null;

  constructor(rt: PluginRT) {
    this.handle = fork(__dirname + '/client', [], {
      stdio: 'inherit',
      cwd: rt.config.installDir
    });
    this.handle.on('message', this.handleMessage.bind(this));
    this.readable = null;
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
    spawnSync('npm', [ 'init', '-y' ], {
      cwd: config.installDir,
      stdio: 'inherit'
    });
    return;
  }
  /**
   * fetch and check if the package name is valid.
   * @param name the plugin package name.
   */
  async fetch(name: string): Promise<NpmPackage> {
    const npmRegistryUrl = `http://registry.npmjs.com/${name}`;
    debug(`requesting the url ${npmRegistryUrl}`);
    const resp = await request(npmRegistryUrl);
    const metadata = JSON.parse(resp) as NpmPackageMetadata;
    return selectLatestPackage(metadata);
  }
  /**
   * Install the given plugin by name.
   * @param name the plugin package name
   */
  async install(pkg: NpmPackage): Promise<boolean> {
    spawnSync('npm', [
      'install', `${pkg.name}@${pkg.version}`, '--save'
    ], {
      cwd: this.config.installDir,
      stdio: 'inherit'
    });
    return true;
  }
  /**
   * Run the plugin by given arguments.
   * @param name the plugin name
   * @param args the plugin args to run
   */
  async run(name: string, args?: any): Promise<any> {
    const runnable = new PluginRunnable(this);
    runnable.start();

    const d = await runnable.read();
    if (d.message.event === 'success') {
      runnable.write({
        event: 'load',
        params: [ name ].concat(args)
      });
    }

    console.log('got', d);
  }
}
