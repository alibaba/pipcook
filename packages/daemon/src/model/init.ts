import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import { scope, ScopeEnum, provide, async, init } from 'midway';
import { DB_PATH } from '../utils/tools';

@scope(ScopeEnum.Singleton)
@async()
@provide('pipcookDB')
export default class DB {
  sequelize: Sequelize;

  @init()
  async connect(): Promise<void> {
    Sequelize.useCLS(cls.createNamespace('pipcook-cls'));
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DB_PATH
    });
    await sequelize.sync();
    this.sequelize = sequelize;
  }
}
