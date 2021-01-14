import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

const config = {
  name: 'pipcook',
  connector: 'loopback-connector-sqlite3',
  file: process.env.PIPCOOK_STORAGE ?? CoreConstants.PIPCOOK_STORAGE
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class PipcookDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'pipcook';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.pipcook', { optional: true })
    dsConfig: Record<string, unknown> = config,
  ) {
    super(dsConfig);
  }
}
