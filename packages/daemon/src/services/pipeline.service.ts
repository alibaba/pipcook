import { injectable, BindingScope, service } from '@loopback/core';
import {
  Count
} from '@loopback/repository';
import * as HttpStatus from 'http-status';
import * as createHttpError from 'http-errors';
import {
  constants as CoreConstants,
  PluginStatus,
  PluginTypeI
} from '@pipcook/pipcook-core';
import { PluginRunnable } from '@pipcook/costa';
import { Pipeline, Job } from '../models';
import { PluginService } from './plugin.service';
import { PluginRepository, PipelineRepository, JobRepository } from '../repositories';
import { PluginInfo } from '../job-runner';
import { repository } from '@loopback/repository';

interface SelectJobsFilter {
  pipelineId?: string;
}

@injectable({ scope: BindingScope.SINGLETON })
export class PipelineService {
  runnableMap: Record<string, PluginRunnable> = {};

  constructor(
    @service(PluginService)
    public pluginService: PluginService,

    @repository(PipelineRepository)
    public pipelineRepository: PipelineRepository,

    @repository(JobRepository)
    public jobRepository: JobRepository,

    @repository(PluginRepository)
    public pluginRepository: PluginRepository
  ) { }

  async createPipeline(config: Pipeline): Promise<Pipeline> {
    return this.pipelineRepository.create(config);
  }

  async removeAllPipelines(): Promise<Count> {
    return this.pipelineRepository.deleteAll();
  }

  async queryPipelines(offset?: number, limit?: number): Promise<Pipeline[]> {
    return this.pipelineRepository.find({
      offset,
      limit,
      order: [ 'createdAt DESC' ]
    });
  }

  async queryJobs(opts: SelectJobsFilter): Promise<Job[]> {
    return this.jobRepository.find({
      where: opts,
      order: [ 'createdAt DESC' ]
    })
  }

  async removePipelineById(id: string): Promise<void> {
    return this.pipelineRepository.deleteById(id);
  }

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
