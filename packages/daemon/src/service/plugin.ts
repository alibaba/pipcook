import { provide, inject } from 'midway';
import { generate } from 'shortid';
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions } from '@pipcook/costa';
import { PluginStatus } from '@pipcook/pipcook-core';
import { LogManager, LogObject } from './log-manager';
import PluginRuntime from '../boot/plugin';
import { PluginModelStatic, PluginModel } from '../model/plugin';
import { PluginInstallingResp, PluginResp } from '../interface';

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

@provide('pluginManager')
export class PluginManager {

  @inject('logManager')
  logManager: LogManager;

  @inject('pluginModel')
  model: PluginModelStatic;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

  get datasetRoot() {
    return this.pluginRT.costa.options.datasetDir;
  }

  async fetch(name: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetch(name);
  }

  async fetchByStream(stream: NodeJS.ReadableStream): Promise<PluginPackage> {
    return this.pluginRT.costa.fetchByStream(stream);
  }

  async fetchAndInstall(name: string, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetch(name);
    const plugin = await this.findOrCreateByPkg(pkg);
    try {
      await this.install(pkg, { pyIndex, force: false, stdout: process.stdout, stderr: process.stderr });
    } catch (err) {
      this.setFailedById(plugin.id, err.message);
      throw err;
    }
    return pkg;
  }

  async createRunnable(id: string): Promise<PluginRunnable> {
    return this.pluginRT.costa.createRunnable({ id } as BootstrapArg);
  }

  async list(filter?: ListPluginsFilter): Promise<PluginModel[]> {
    const where = {} as any;
    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.datatype) {
      where.datatype = filter.datatype;
    }
    return this.model.findAll({ where });
  }

  async query(filter?: ListPluginsFilter): Promise<PluginModel[]> {
    const where = {} as any;
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.datatype) {
      where.datatype = filter.datatype;
    }
    return this.model.findAll({ where });
  }

  async findById(id: string): Promise<PluginModel> {
    return this.model.findOne({ where: { id } });
  }

  async removeById(id: string): Promise<number> {
    return this.model.destroy({ where: { id } });
  }

  async setFailedById(id: string, errMsg: string): Promise<number> {
    const [ count ] = await this.model.update({
      status: PluginStatus.FAILED,
      error: errMsg
    }, {
      where: { id }
    });
    return count;
  }

  async findOrCreateByPkg(pkg: PluginPackage): Promise<PluginModel> {
    const [ plugin ] = await this.model.findOrCreate({
      where: {
        name: pkg.name,
        version: pkg.version
      },
      defaults: {
        id: generate(),
        name: pkg.name,
        version: pkg.version,
        category: pkg.pipcook.category,
        datatype: pkg.pipcook.datatype,
        dest: pkg.pipcook.target.DESTPATH,
        status: PluginStatus.INSTALLING
      }
    });
    return plugin;
  }

  async install(pkg: PluginPackage, opts: InstallOptions): Promise<void> {
    try {
      await this.pluginRT.costa.install(pkg, opts);
    } catch (err) {
      // uninstall if occurring an error on installing.
      await this.pluginRT.costa.uninstall(pkg.name);
      throw err;
    }
  }
  async startInstall(pkg: PluginPackage, pyIndex?: string, force?: boolean): Promise<PluginInstallingResp> {
    const logObject = this.logManager.create();
    const plugin = await this.findOrCreateByPkg(pkg);
    process.nextTick(async () => {
      try {
        await this.install(pkg, { pyIndex, force, stdout: logObject.stdout, stderr: logObject.stderr });
        this.logManager.destroy(logObject.id);
      } catch (err) {
        this.setFailedById(plugin.id, err.message);
        console.error('install plugin from tarball error', err.message);
        this.logManager.destroy(logObject.id, err);
      }
    });
    return { ...(plugin.toJSON() as PluginResp), logId: logObject.id };
  }
  /**
   * install by package name or tarball url or git url
   * @param pkgName string package name, tarball url, git url
   * @param pyIndex string python package index
   * @param force boolean if true, the installed plugin will be reinstall
   */
  async installByName(pkgName: string, pyIndex?: string, force?: boolean): Promise<PluginInstallingResp> {
    const pkg = await this.fetch(pkgName);
    return this.startInstall(pkg, pyIndex, force);
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

  async installFromTarStream(tarball: NodeJS.ReadableStream, pyIndex?: string, force?: boolean): Promise<PluginInstallingResp> {
    const pkg = await this.fetchByStream(tarball);
    return this.startInstall(pkg, pyIndex, force);
  }

  getInstallLog(id: string): LogObject {
    return this.logManager.get(id);
  }
}
