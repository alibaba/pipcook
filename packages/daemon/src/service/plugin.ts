import { provide, inject, Context } from 'midway';
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions } from '@pipcook/costa';
import { PluginStatus, generateId } from '@pipcook/pipcook-core';
import { LogManager, LogObject } from './log-manager';
import PluginRuntime from '../boot/plugin';
import { PluginModelStatic, PluginModel } from '../model/plugin';
import { PluginResp, TraceResp } from '../interface';

interface ListPluginsFilter {
  datatype?: string;
  category?: string;
  name?: string;
}

@provide('pluginManager')
export class PluginManager {

  @inject()
  ctx: Context;

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

  async fetchAndInstall(name: string, log: LogObject, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetch(name);
    const plugin = await this.findOrCreateByPkg(pkg);
    if (plugin.status !== PluginStatus.INSTALLED) {
      try {
        await this.install(pkg, { pyIndex, force: false, stdout: log.stdout, stderr: log.stderr });
        this.setStatusById(plugin.id, PluginStatus.INSTALLED);
      } catch (err) {
        this.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
        throw err;
      }
    }
    return pkg;
  }

  async createRunnable(id: string, logger: LogObject): Promise<PluginRunnable> {
    return this.pluginRT.costa.createRunnable({ id, logger } as BootstrapArg);
  }

  async list(filter?: ListPluginsFilter): Promise<PluginModel[]> {
    const where = {} as any;
    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.datatype) {
      where.datatype = filter.datatype;
    }
    if (filter?.name) {
      where.name = filter.name;
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

  async setStatusById(id: string, status: PluginStatus, errMsg?: string): Promise<number> {
    const [ count ] = await this.model.update({
      status,
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
        id: generateId(),
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

  async installAsync(pkg: PluginPackage, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const logger = await this.logManager.create();
    const plugin = await this.findOrCreateByPkg(pkg);
    if (plugin.status !== PluginStatus.INSTALLED) {
      process.nextTick(async () => {
        try {
          await this.install(pkg, { pyIndex, force, stdout: logger.stdout, stderr: logger.stderr });
          this.setStatusById(plugin.id, PluginStatus.INSTALLED);
          this.logManager.destroy(logger.id);
        } catch (err) {
          this.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
          console.error('install plugin error', err.message);
          this.logManager.destroy(logger.id, err);
        }
      });
    }
    return { ...(plugin.toJSON() as PluginResp), traceId: logger.id };
  }
  /**
   * install by package name or tarball url or git url
   * @param pkgName string package name, tarball url, git url
   * @param pyIndex string python package index
   * @param force boolean if true, the installed plugin will be reinstall
   */
  async installByName(pkgName: string, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const pkg = await this.fetch(pkgName);
    return this.installAsync(pkg, pyIndex, force);
  }

  async uninstall(plugin: PluginModel | PluginModel[]): Promise<void> {
    const { costa } = this.pluginRT;
    if (Array.isArray(plugin)) {
      const names = plugin.map(singlePlugin => singlePlugin.name);
      await costa.uninstall(names);
      plugin.forEach(async (singlePlugin) => {
        await singlePlugin.destroy();
      });
    } else {
      await costa.uninstall(plugin.name);
      await plugin.destroy();
    }
  }

  async installFromTarStream(tarball: NodeJS.ReadableStream, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const pkg = await this.fetchByStream(tarball);
    return this.installAsync(pkg, pyIndex, force);
  }
}
