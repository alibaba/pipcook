import { scope, ScopeEnum, provide, async, init } from 'midway';
import { readJSON } from 'fs-extra';
import { CostaRuntime } from '@pipcook/costa';
import {
  PIPCOOK_PLUGIN_DIR,
  PIPCOOK_DATASET_DIR,
  PIPCOOK_RUN_DIR,
  PIPCOOK_DAEMON_CONFIG
} from '../utils/constants';

@scope(ScopeEnum.Singleton)
@async()
@provide('pluginRT')
export default class PluginRuntime {
  costa: CostaRuntime;

  @init()
  async connect(): Promise<void> {
    let npmRegistryPrefix = 'https://registry.npmjs.com/';
    try {
      const config = await readJSON(PIPCOOK_DAEMON_CONFIG);
      npmRegistryPrefix = config.npmRegistryPrefix || npmRegistryPrefix;
    } catch (err) {
      console.warn(`${PIPCOOK_DAEMON_CONFIG} not existed.`);
    }

    this.costa = new CostaRuntime({
      installDir: PIPCOOK_PLUGIN_DIR,
      datasetDir: PIPCOOK_DATASET_DIR,
      componentDir: PIPCOOK_RUN_DIR,
      npmRegistryPrefix
    });
  }
}
