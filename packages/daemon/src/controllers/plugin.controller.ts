import {
  Filter,
  repository
} from '@loopback/repository';
import { service, inject } from '@loopback/core';
import {
  api, del, get,
  getModelSchemaRef, param,
  getJsonSchema,
  post, put,
  Request, Response,
  requestBody, RestBindings
} from '@loopback/rest';
import { Plugin } from '../models';
import { PluginRepository } from '../repositories';
import { PluginService, PluginTraceResp, TraceService } from '../services';
import { PluginInstallPararmers } from './interface';
import { BaseEventController } from './base';
import { PluginPackage } from '@pipcook/costa';
import * as multer from 'multer';
import Debug from 'debug';

const debug = Debug('daemon.app.plugin');

export const pluginInstallSpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(PluginInstallPararmers)
    }
  }
};

@api({ basePath: '/api/plugin' })
export class PluginController extends BaseEventController {

  constructor(
    @service(PluginService)
    public pluginService: PluginService,
    @service(TraceService)
    public traceService: TraceService,
    @repository(PluginRepository)
    public pluginRepository: PluginRepository
  ) {
    super(traceService);
  }

  // TODO(feely): check if the plugin has been installed
  /**
   * create plugin and install it
   */
  @post('/', {
    responses: {
      '200': {
        description: 'Plugin model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(PluginTraceResp)
          }
        }
      }
    }
  })
  async create(
    @requestBody(pluginInstallSpec) params: PluginInstallPararmers
  ): Promise<PluginTraceResp> {
    const { name, pyIndex } = params;
    debug(`plugin create, checking info: ${name} ${pyIndex}.`);
    return this.pluginService.installByName(name, pyIndex, false);
  }

  /**
   * reinstall plugin
   */
  @put('/', {
    responses: {
      '204': {
        description: 'Plugin reinstall success',
        content: {
          'application/json': {
            schema: getModelSchemaRef(PluginTraceResp)
          }
        }
      }
    }
  })
  async reInstallByName(
    @requestBody(pluginInstallSpec) params: PluginInstallPararmers
  ): Promise<PluginTraceResp> {
    const { name, pyIndex } = params;
    debug(`reinstall plugin, checking info: ${name} ${pyIndex}.`);
    return this.pluginService.installByName(name, pyIndex, true);
  }

  /**
   * delete plugin by name
   */
  @del('/{id}', {
    responses: {
      '204': {
        description: 'Plugin DELETE success'
      }
    }
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const plugin = await this.pluginRepository.findById(id);
    return this.pluginService.uninstall(plugin);
  }

  /**
   * delete all plugins
   */
  @del('/', {
    responses: {
      '204': {
        description: 'All plugins DELETE success'
      }
    }
  })
  public async removeAll(): Promise<void> {
    const plugins = await this.pluginRepository.find();
    return this.pluginService.uninstall(plugins);
  }

  /**
   * get metadata from name
   */
  @get('/metadata', {
    responses: {
      '200': {
        description: 'Array of Plugin model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                version: { type: 'string' },
                main: { type: 'string' },
                dependencies: { type: 'object' },
                pipcook: { type: 'object' }
              }
            }
          }
        }
      }
    }
  })
  public async getMetadata(
    @param.query.string('name') name: string
  ): Promise<PluginPackage> {
    return this.pluginService.fetch(name);
  }

  /**
   * find a plugin by id
   */
  @get('/{id}', {
    responses: {
      '200': {
        description: 'Plugin model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Plugin, { includeRelations: true })
          }
        }
      }
    }
  })
  async findById(
    @param.path.string('id') id: string
  ): Promise<Plugin> {
    return this.pluginRepository.findById(id);
  }

  /**
   * fetch the plugin metadata by a id
   */
  @get('/{id}/metadata')
  public async getMetadataById(
    @param.path.string('id') id: string
  ): Promise<PluginPackage> {
    const plugin = await this.pluginRepository.findById(id);
    return this.pluginService.fetch(`${plugin.name}@${plugin.version}`);
  }

  /**
   * list plugins
   */
  @get('/', {
    responses: {
      '200': {
        description: 'Array of Plugin model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Plugin, { includeRelations: true })
            }
          }
        }
      }
    }
  })
  async list(
    @param.filter(Plugin) filter?: Filter<Plugin>
  ): Promise<Plugin[]> {
    return this.pluginRepository.find(filter);
  }

  /**
   * create a plugin by tarball stream
   */
  @post('/tarball', {
    responses: {
      description: 'plugin tracer',
      '200': {
        content: {
          'application/json': {
            schema: getJsonSchema(PluginTraceResp)
          }
        }
      }
    }
  })
  public async uploadPackage(
    @requestBody({
      description: 'plugin tarball',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              file: {
                type: 'string',
                format: 'binary'
              },
              pyIndex: {
                type: 'string'
              }
            }
          }
        }
      }
    })
      request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<PluginTraceResp> {
    let traceResp: PluginTraceResp;
    const upload = multer({
      storage: {
        _handleFile: (
          req: Request,
          file: Express.Multer.File,
          callback: (error?: Error | null, info?: Partial<Express.Multer.File>) => void
        ): void => {
          this.pluginService.installFromTarStream(file.stream, req.body.pyIndex, false).then(
            (traceObj) => {
              traceResp = traceObj;
              callback(null, file);
            },
            callback
          );
        },
        _removeFile: (
          req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null) => void
        ): void => {
          callback(null);
        }
      }
    });
    return new Promise<PluginTraceResp>((resolve, reject) => {
      upload.single('file')(request, response, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(traceResp);
        }
      });
    });
  }
}
