import { injectable, BindingScope } from '@loopback/core';
import { PluginPackage, BootstrapArg, PluginRunnable, InstallOptions } from '@pipcook/costa';
import { PluginStatus } from '@pipcook/pipcook-core';
import { TraceService } from './trace.service';
import { Tracer } from './interface';
import { pluginQueue } from '../utils';
import { CostaRuntime } from '@pipcook/costa';
import { constants as CoreConstants } from '@pipcook/pipcook-core';
import { repository } from '@loopback/repository';
import { service } from '@loopback/core';
import { Plugin } from '../models';
import { PluginRepository } from '../repositories';
import { PluginTraceResp } from './interface';

@injectable({ scope: BindingScope.SINGLETON })
export class PluginService {

  costa: CostaRuntime;

  constructor(
    @repository(PluginRepository)
    public pluginRepository: PluginRepository,
    @service(TraceService)
    public traceService: TraceService
  ) {
    const npmRegistryPrefix = 'https://registry.npmjs.com/';
    // FIXME(feely): fix the boot code
    // try {
    //   const config = await readJSON(CoreConstants.PIPCOOK_DAEMON_CONFIG);
    //   npmRegistryPrefix = config.npmRegistryPrefix || npmRegistryPrefix;
    // } catch (err) {
    //   console.warn(`read ${CoreConstants.PIPCOOK_DAEMON_CONFIG} error: ${err.message}.`);
    // }

    this.costa = new CostaRuntime({
      installDir: CoreConstants.PIPCOOK_PLUGINS,
      datasetDir: CoreConstants.PIPCOOK_DATASET,
      componentDir: CoreConstants.PIPCOOK_RUN,
      npmRegistryPrefix
    });
  }

  get datasetRoot() {
    return this.costa.options.datasetDir;
  }

  async fetch(name: string): Promise<PluginPackage> {
    return this.costa.fetch(name);
  }

  /**
   * fetch pakcage info by plugin name
   * @param name plugin name
   */
  async fetchFromInstalledPlugin(name: string): Promise<PluginPackage> {
    return this.costa.fetchFromInstalledPlugin(name);
  }
  async fetchByStream(stream: NodeJS.ReadableStream): Promise<PluginPackage> {
    return this.costa.fetchByStream(stream);
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

  async findByIds(ids: string[]) {
    return this.pluginRepository.find({
      where: {
        id: {
          inq: ids
        }
      }
    })
  }

  async createRunnable(id: string, tracer: Tracer): Promise<PluginRunnable> {
    return this.costa.createRunnable({ id, logger: tracer.getLogger() } as BootstrapArg);
  }

  async setStatusById(id: string, status: PluginStatus, error?: string): Promise<void> {
    return this.pluginRepository.updateById(id, { status, error });
  }

  async findOrCreateByPkg(pkg: PluginPackage): Promise<Plugin> {
    const plugin = await this.pluginRepository.findOne({ where: { name: pkg.name } });
    if (plugin) {
      return plugin;
    } else {
      return this.pluginRepository.create({
        name: pkg.name,
        version: pkg.version,
        category: pkg.pipcook.category,
        datatype: pkg.pipcook.datatype,
        dest: pkg.pipcook.target?.DESTPATH,
        sourceFrom: pkg.pipcook.source.from,
        sourceUri: pkg.pipcook.source.uri,
        status: PluginStatus.INITIALIZED
      });
    }
  }

  async install(pluginId: string, pkg: PluginPackage, opts: InstallOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      pluginQueue.push((cb) => {
        this.setStatusById(pluginId, PluginStatus.INSTALLING);
        this.costa.install(pkg, opts).then(() => {
          resolve();
          if (cb) {
            cb();
          }
        }).catch((err) => {
          // uninstall if occurring an error on installing.
          this.costa.uninstall(pkg);
          reject(err);
          if (cb) {
            cb();
          }
        });
      });
    });
  }

  async installAtNextTick(pkg: PluginPackage, pyIndex?: string, force?: boolean): Promise<PluginTraceResp> {
    const plugin = await this.findOrCreateByPkg(pkg);
    if (plugin.status !== PluginStatus.INSTALLED) {
      const tracer = await this.traceService.create();
      process.nextTick(async () => {
        try {
          this.setStatusById(plugin.id, PluginStatus.PENDING);
          await this.install(plugin.id, pkg, { pyIndex, force, ...tracer.getLogger() });
          this.setStatusById(plugin.id, PluginStatus.INSTALLED);
          this.traceService.destroy(tracer.id);
          console.log('install successfully', pkg.name);
        } catch (err) {
          this.setStatusById(plugin.id, PluginStatus.FAILED, err.message);
          console.error('install plugin error', err.message);
          this.traceService.destroy(tracer.id, err);
        }
      });
      return new PluginTraceResp({ ...plugin.toJSON(), traceId: tracer.id });
    } else {
      return plugin as PluginTraceResp;
    }
  }
  /**
   * install by package name or tarball url or git url
   * @param pkgName string package name, tarball url, git url
   * @param pyIndex string python package index
   * @param force boolean if true, the installed plugin will be reinstall
   */
  async installByName(pkgName: string, pyIndex?: string, force?: boolean): Promise<PluginTraceResp> {
    const pkg = await this.fetch(pkgName);
    return this.installAtNextTick(pkg, pyIndex, force);
  }

  async findByName(name: string): Promise<Plugin | null> {
    return this.pluginRepository.findOne({ where: { name } });
  }

  async uninstall(plugin: Plugin | Plugin[]): Promise<void> {
    if (Array.isArray(plugin)) {
      await this.costa.uninstall(plugin);
      await Promise.all(plugin.map((singlePlugin) => {
        return this.pluginRepository.deleteById(singlePlugin.id);
      }));
    } else {
      await this.costa.uninstall(plugin);
      await this.pluginRepository.deleteById(plugin.id);
    }
  }

  async installFromTarStream(tarball: NodeJS.ReadableStream, pyIndex?: string, force?: boolean): Promise<PluginTraceResp> {
    const pkg = await this.fetchByStream(tarball);
    return this.installAtNextTick(pkg, pyIndex, force);
  }
}
