/**
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * DVC DB
 */
import { Sequelize } from 'sequelize';
import { scope, ScopeEnum, provide, async, init } from 'midway';
import * as path from 'path';

@scope(ScopeEnum.Singleton)
@async()
@provide('pipcookDB')
export default class DB {
  sequelize;

  @init()
  connect() {
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', '..', 'db', 'pipcook.db')
    });
    this.sequelize.sync();
  }
}
