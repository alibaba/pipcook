/**
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * DVC DB
 */
import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import { scope, ScopeEnum, provide, async, init } from 'midway';
import * as path from 'path';

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
      storage: path.join(__dirname, '..', '..', 'db', 'pipcook.db')
    });
    this.sequelize.sync();
  }
}
