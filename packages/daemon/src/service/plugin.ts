import { provide, inject } from 'midway';
import * as uuid from 'uuid';
import { Readable } from 'stream';
import PluginRuntime from '../boot/plugin';
import { PluginModelStatic, PluginModel } from '../model/plugin';
import { PluginPackage, BootstrapArg, PluginRunnable, LogWriter } from '@pipcook/costa';
import { LogManager, LogObject } from './log-manager';
import { Context } from 'midway';
import process = require('process');

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

  get datasetRoot() {
    return this.pluginRT.costa.options.datasetDir;
  }

  async fetch(name: string, cwd?: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetch(name, cwd);
  }

  async fetchByStream(stream: Readable): Promise<PluginPackage> {
    return this.pluginRT.costa.fetchByStream(stream);
  }

  async fetchAndInstall(name: string, cwd?: string, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetch(name, cwd);
    await this.install(pkg, { stdout: process.stdout, stderr: process.stderr }, pyIndex);
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

  async install(pkg: PluginPackage, logWriter: LogWriter, pyIndex?: string): Promise<PluginModel> {
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
      await this.pluginRT.costa.install(pkg, logWriter, false, pyIndex);
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
    const logObject = this.logManager.createLogStream();
    const pkg = await this.fetchByStream(tarball);
    process.nextTick(async () => {
      try {
        await this.install(pkg, logObject.logTransfroms);
        this.logManager.destroyLog(logObject.id);
      } catch (err) {
        console.error('install plugin from tarball error', err.message);
        this.logManager.destroyLog(logObject.id, err);
      }
    });
    return { logId: logObject.id, plugin: pkg };
  }

  async getInstallLogStream(id: string): Promise<LogObject> {
    return this.logManager.getLog(id);
  }
}
