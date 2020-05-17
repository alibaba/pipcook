import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import * as path from 'path';

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1587976396334_3860';

  // add your config here
  config.middleware = [
  ];

  config.security = {
    csrf: {
      enable: false,
    }
  };

  config.static = {
    prefix: '/',
    dir: path.join(appInfo.baseDir, 'app/public'),
  };

  return config;
};
