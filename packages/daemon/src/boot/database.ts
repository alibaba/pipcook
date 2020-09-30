import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import * as sqlite3 from 'sqlite3';
import { scope, ScopeEnum, provide, async, config } from 'midway';
import { ensureDir, readdir } from 'fs-extra';
import { dirname, join } from 'path';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

sqlite3.verbose();

@scope(ScopeEnum.Singleton)
@async()
@provide('pipcookDB')
export default class DB {
  sequelize: Sequelize;

  @config('sequelizeLogger')
  logger: boolean | ((sql: string, timing?: number) => void);

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
    const modelDir = join(__dirname, '../model');
    const models = await readdir(modelDir);
    await Promise.all(models.map(async (model) => {
      const modelInit = await import(join(modelDir, model));
      if (modelInit && typeof modelInit.default === 'function') {
        modelInit.default(sequelize);
      }
    }));
    this.sequelize = sequelize;
  }
}
