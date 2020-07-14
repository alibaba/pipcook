import { provide, inject } from 'midway';
import * as uuid from 'uuid';
import { Readable } from 'stream';
import PluginRuntime from '../boot/plugin';
import { PluginModelStatic, PluginModel } from '../model/plugin';
import { PluginPackage, BootstrapArg, PluginRunnable } from '@pipcook/costa';
import { LogManager, LogObject } from './log-manager';
import { Context } from 'midway';

class PluginNotFound extends TypeError {
  status: number;
  plugin: string;
  constructor(name: string) {
    super(`cannot find the plugin "${name}"`);
    this.plugin = name;
    this.status = 400;
  }
}

interface ListPluginsFilter {
  datatype?: string;
  category?: string;
}

interface PluginAndLog {
  logId: string;
  plugin: PluginPackage;
}

interface LogReader {
  stdout: Readable;
  stderr: Readable;
}

@provide('pluginManager')
export class PluginManager {

  @inject('logManager')
  logManager: LogManager;

  @inject('pluginModel')
  model: PluginModelStatic;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

  @inject()
  ctx: Context;

  logObject: LogObject;

  get datasetRoot() {
    return this.pluginRT.costa.options.datasetDir;
  }

  async fetch(name: string, cwd?: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetch(name, cwd);
  }

  async fetchByStream(stream: Readable, cwd?: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetchByStream(stream, cwd);
  }

  async fetchAndInstall(name: string, cwd?: string, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetch(name, cwd);
    await this.install(pkg, pyIndex);
    return pkg;
  }

  async fetchAndInstallByStream(stream: Readable, cwd?: string, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetchByStream(stream, cwd);
    await this.install(pkg, pyIndex);
    return pkg;
  }

  async createRunnable(id: string): Promise<PluginRunnable> {
    return this.pluginRT.costa.createRunnable({ id } as BootstrapArg);
  }

  async list(filter?: ListPluginsFilter): Promise<PluginModel[]> {
    const where = {} as any;
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.datatype) {
      where.datatype = filter.datatype;
    }
    return this.model.findAll({ where });
  }

  async install(pkg: PluginPackage, pyIndex?: string): Promise<PluginModel> {
    const [ plugin ] = await this.model.findOrCreate({
      where: {
        name: pkg.name,
        version: pkg.version
      },
      defaults: {
        id: uuid.v1(),
        name: pkg.name,
        version: pkg.version,
        category: pkg.pipcook.category,
        datatype: pkg.pipcook.datatype,
        dest: pkg.pipcook.target.DESTPATH
      }
    });

    try {
      await this.pluginRT.costa.install(pkg, this.logObject.logTransfroms, false, pyIndex);
    } catch (err) {
      // uninstall if occurring an error on installing.
      await this.pluginRT.costa.uninstall(pkg.name);
      throw err;
    }
    return plugin;
  }

  async uninstall(name: string): Promise<void> {
    const { costa } = this.pluginRT;
    const plugins = await this.model.findAll({
      where: { name }
    });
    if (plugins.length === 0) {
      throw new PluginNotFound(name);
    }
    await plugins.map(async (plugin: PluginModel) => {
      await costa.uninstall(plugin.name);
      await plugin.destroy();
    });
  }

  async installFromTarStream(tarball: Readable): Promise<PluginAndLog> {
    this.logObject = this.logManager.createLogStream();
    const pkg = await this.fetchByStream(tarball);
    process.nextTick(async () => {
      try {
        await this.install(pkg);
        this.logManager.destroyLog(this.logObject.id);
      } catch (err) {
        console.error('install plugin from tarball error', err.message);
        this.logManager.destroyLog(this.logObject.id, err);
      }
    });
    return { logId: this.logObject.id, plugin: pkg };
  }

  async getInstallLogStream(id: string): Promise<LogReader> {
    return this.logManager.getLog(id).logTransfroms;
  }
}
