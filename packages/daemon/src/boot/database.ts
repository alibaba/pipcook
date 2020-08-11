import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import * as sqlite3 from 'sqlite3';
import { scope, ScopeEnum, provide, async, init, config } from 'midway';
import { ensureDir } from 'fs-extra';
import { dirname } from 'path';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

sqlite3.verbose();

@scope(ScopeEnum.Singleton)
@async()
@provide('pipcookDB')
export default class DB {
  sequelize: Sequelize;

  @config('sequelizeLogger')
  logger: boolean | ((sql: string, timing?: number) => void);

  @init()
  async connect(): Promise<void> {
    // ensure the dir firstly.
    await ensureDir(dirname(CoreConstants.PIPCOOK_STORAGE));

    // create the sequelize instance.
    Sequelize.useCLS(cls.createNamespace('pipcook-cls'));
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.PIPCOOK_STORAGE || CoreConstants.PIPCOOK_STORAGE,
      logging: this.logger
    });
    await sequelize.sync();
    this.sequelize = sequelize;
  }
}
