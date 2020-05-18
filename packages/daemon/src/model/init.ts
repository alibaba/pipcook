import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import { scope, ScopeEnum, provide, async, init } from 'midway';
import { DB_PATH } from '../utils/tools';

@scope(ScopeEnum.Singleton)
@async()
@provide('pipcookDB')
export default class DB {
  sequelize;

  @init()
  connect() {
    const pipcookNamespace = cls.createNamespace('pipcook-cls');
    Sequelize.useCLS(pipcookNamespace);
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DB_PATH
    });
    this.sequelize.sync();
  }
}
