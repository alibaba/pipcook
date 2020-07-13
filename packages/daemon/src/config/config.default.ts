import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import * as os from 'os';
import * as path from 'path';

const staticDir =
  process.env.NODE_ENV === 'local' ?
  path.join(__dirname, '..', '..', '..', 'pipboard', 'build') :
  path.join(os.homedir(), '.pipcook', 'pipboard', 'node_modules', '@pipcook', 'pipboard', 'build');

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1587976396334_3860';

  // add your config here
  config.middleware = [];
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  };

  config.security = {
    csrf: {
      enable: false,
    }
  };

  config.static = {
    prefix: '/',
    dir: staticDir,
  };

  return config;
};
