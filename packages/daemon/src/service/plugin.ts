import { provide, inject } from 'midway';
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions } from '@pipcook/costa';
import { PluginStatus } from '@pipcook/pipcook-core';
import { TraceManager, Tracer } from './trace-manager';
import PluginRuntime from '../boot/plugin';
import { PluginModel, PluginEntity, ListPluginsFilter } from '../model/plugin';
import { PluginResp, TraceResp } from '../interface';
import { pluginQueue } from '../utils';

export { PluginEntity } from '../model/plugin';

@provide('pluginManager')
export class PluginManager {

  @inject('traceManager')
  traceManager: TraceManager;

  @inject('pluginRT')
  pluginRT: PluginRuntime;

  get datasetRoot() {
    return this.pluginRT.costa.options.datasetDir;
  }

  async fetch(name: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetch(name);
  }

  /**
   * fetch pakcage info by plugin name
   * @param name plugin name
   */
  async fetchFromInstalledPlugin(name: string): Promise<PluginPackage> {
    return this.pluginRT.costa.fetchFromInstalledPlugin(name);
  }
  async fetchByStream(stream: NodeJS.ReadableStream): Promise<PluginPackage> {
    return this.pluginRT.costa.fetchByStream(stream);
  }

  async fetchAndInstall(name: string, tracer: Tracer, pyIndex?: string): Promise<PluginPackage> {
    const pkg = await this.fetch(name);
    const plugin = await this.findOrCreateByPkg(pkg);
    if (plugin.status !== PluginStatus.INSTALLED) {
      try {
        await this.install(plugin.id, pkg, { pyIndex, force: false, ...tracer.getLogger() });
        this.setStatusById(plugin.id, PluginStatus.INSTALLED);
      } catch (err) {
        this.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
        throw err;
      }
    }
    return pkg;
  }

  async createRunnable(id: string, tracer: Tracer): Promise<PluginRunnable> {
    return this.pluginRT.costa.createRunnable({ id, logger: tracer.getLogger() } as BootstrapArg);
  }

  async list(filter?: ListPluginsFilter): Promise<PluginEntity[]> {
    return PluginModel.list(filter);
  }

  async findById(id: string): Promise<PluginEntity> {
    return PluginModel.findById(id);
  }

  async findByPrefixId(prefixId: string): Promise<PluginEntity[]> {
    return PluginModel.findByPrefixId(prefixId);
  }

  async findByIds(ids: string[]): Promise<PluginEntity[]> {
    return PluginModel.findByIds(ids);
  }
  async findByName(name: string): Promise<PluginEntity> {
    return PluginModel.findByName(name);
  }

  async removeById(id: string): Promise<number> {
    return PluginModel.removeById(id);
  }

  async setStatusById(id: string, status: PluginStatus, errMsg?: string): Promise<number> {
    return PluginModel.setStatusById(id, status);
  }

  async findOrCreateByPkg(pkg: PluginPackage): Promise<PluginEntity> {
    return PluginModel.findOrCreateByParams({
      name: pkg.name,
      version: pkg.version,
      category: pkg.pipcook.category,
      datatype: pkg.pipcook.datatype,
      dest: pkg.pipcook.target.DESTPATH,
      sourceFrom: pkg.pipcook.source.from,
      sourceUri: pkg.pipcook.source.uri,
      status: PluginStatus.INITIALIZED
    });
  }

  async install(pluginId: string, pkg: PluginPackage, opts: InstallOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      pluginQueue.push((cb) => {
        this.setStatusById(pluginId, PluginStatus.INSTALLING);
        this.pluginRT.costa.install(pkg, opts).then(() => {
          resolve();
          cb();
        }).catch((err) => {
          // uninstall if occurring an error on installing.
          this.pluginRT.costa.uninstall(pkg);
          reject(err);
          cb();
        });
      });
    });
  }

  async installAtNextTick(pkg: PluginPackage, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const plugin = await this.findOrCreateByPkg(pkg);
    if (plugin.status !== PluginStatus.INSTALLED) {
      const tracer = await this.traceManager.create();
      process.nextTick(async () => {
        try {
          this.setStatusById(plugin.id, PluginStatus.PENDING);
          await this.install(plugin.id, pkg, { pyIndex, force, ...tracer.getLogger() });
          this.setStatusById(plugin.id, PluginStatus.INSTALLED);
          this.traceManager.destroy(tracer.id);
        } catch (err) {
          this.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
          console.error('install plugin error', err.message);
          this.traceManager.destroy(tracer.id, err);
        }
      });
      return { ...plugin, traceId: tracer.id };
    } else {
      return { ...plugin, traceId: '' };
    }
  }
  /**
   * install by package name or tarball url or git url
   * @param pkgName string package name, tarball url, git url
   * @param pyIndex string python package index
   * @param force boolean if true, the installed plugin will be reinstall
   */
  async installByName(pkgName: string, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const pkg = await this.fetch(pkgName);
    return this.installAtNextTick(pkg, pyIndex, force);
  }

  async uninstall(plugin: PluginEntity | PluginEntity[]): Promise<void> {
    const { costa } = this.pluginRT;
    if (Array.isArray(plugin)) {
      await costa.uninstall(plugin);
      await Promise.all(plugin.map((singlePlugin) => {
        return PluginModel.removeById(singlePlugin.id);
      }));
    } else {
      await costa.uninstall(plugin);
      await PluginModel.removeById(plugin.id);
    }
  }

  async installFromTarStream(tarball: NodeJS.ReadableStream, pyIndex?: string, force?: boolean): Promise<TraceResp<PluginResp>> {
    const pkg = await this.fetchByStream(tarball);
    return this.installAtNextTick(pkg, pyIndex, force);
  }
}
