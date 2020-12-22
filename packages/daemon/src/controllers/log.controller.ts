import { api, get, param } from '@loopback/rest';
import { service } from '@loopback/core';
import { JobService, TraceService } from '../services';
import { BaseEventController } from './base';

@api({ basePath: '/api/log' })
export class LogController extends BaseEventController {

  constructor(
    @service(JobService)
    public jobService: JobService,
    @service(TraceService)
    public traceService: TraceService
  ) {
    super(traceService);
  }

  /**
   * get log by id
   */
  @get('/view/{id}', {
    responses: {
      '200': {
        description: 'get log by id',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      }
    }
  })
  async view(
    @param.path.string('id') id: string
  ) {
    const data = await this.jobService.getLogById(id);
    return data;
  }
}
