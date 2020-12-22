import { injectable, BindingScope, service } from '@loopback/core';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  constants as CoreConstants,
  PluginStatus,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { PluginRunnable } from '@pipcook/costa';
import { Pipeline } from '../models';
import { PluginService } from './plugin.service';
import { PluginRepository, PipelineRepository } from '../repositories';
import { PluginInfo } from '../job-runner';
import { repository } from '@loopback/repository';

@injectable({ scope: BindingScope.SINGLETON })
export class PipelineService {
  runnableMap: Record<string, PluginRunnable> = {};

  constructor(
    @service(PluginService)
    public pluginService: PluginService,
    @repository(PipelineRepository)
    public pipelineRepository: PipelineRepository,
    @repository(PluginRepository)
    public pluginRepository: PluginRepository
  ) { }

  async getPipelineByIdOrName(idOrName: string): Promise<Pipeline | null> {
    return this.pipelineRepository.findOne({ where: { or: [{ id: idOrName }, { name: idOrName }] } });
  }

  async fetchPlugins(pipeline: Pipeline): Promise<Partial<Record<PluginTypeI, PluginInfo>>> {
    const plugins: Partial<Record<PluginTypeI, PluginInfo>> = {};
    const noneInstalledPlugins: string[] = [];
    for (const type of CoreConstants.PLUGINS) {
      if ((pipeline as any)[type]) {
        if (!(pipeline as any)[`${type}Id`]) {
          noneInstalledPlugins.push((pipeline as any)[type]);
          continue;
        }
        const plugin = await this.pluginRepository.findOne({ where: { id: (pipeline as any)[`${type}Id`] }});
        if (plugin && plugin.status === PluginStatus.INSTALLED) {
          // ignore if any plugin not installed, because will throw an error after processing.
          if (noneInstalledPlugins.length === 0) {
            plugins[type] = await {
              plugin: await this.pluginService.fetchFromInstalledPlugin(plugin.name),
              params: (pipeline as any)[`${type}Params`]
            };
          }
        } else {
          noneInstalledPlugins.push((pipeline as any)[type]);
        }
      }
    }
    if (noneInstalledPlugins.length > 0) {
      throw createHttpError(HttpStatus.NOT_FOUND, `these plugins are not installed: ${JSON.stringify(noneInstalledPlugins)}`);
    }
    return plugins;
  }
}
