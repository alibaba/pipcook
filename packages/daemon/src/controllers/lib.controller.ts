import { service } from '@loopback/core';
import { api, param, post } from '@loopback/rest';
import { LibService } from '../services/lib.service';

@api({ basePath: '/api/lib' })
export class LibController {

  constructor(
    @service(LibService)
    public libService: LibService
  ) { }

  /**
   * install lib to daemon
   */
  @post('/{name}', {
    responses: {
      '204': {
        description: 'lib installed successfully'
      }
    }
  })
  async install(
    @param.path.string('name') name: string
  ): Promise<boolean> {
    return await this.libService.installByName(name);
  }
}
