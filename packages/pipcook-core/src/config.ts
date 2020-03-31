import { Config } from './types/config';
const packageJson = require('../package.json');

const config: Config = {
  version: packageJson.version
}

export default config;