import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import { scope, ScopeEnum, provide, async, init } from 'midway';
import { PIPCOOK_STORAGE } from '../utils/constants';

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
      storage: PIPCOOK_STORAGE
    });
    await sequelize.sync();
    this.sequelize = sequelize;
  }
}
