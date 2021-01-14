import { api, get, param } from '@loopback/rest';
import { service } from '@loopback/core';
import { JobService } from '../services';

@api({ basePath: '/api/log' })
export class LogController {

  constructor(
    @service(JobService)
    public jobService: JobService
  ) { }

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
  ): Promise<string[]> {
    return await this.jobService.getLogById(id);
  }
}
