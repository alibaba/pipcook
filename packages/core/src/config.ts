import { Config } from './types/config';

const config: Config = {
  // See https://docs.npmjs.com/misc/scripts#packagejson-vars
  version: process.env.npm_package_version
};

export default config;
