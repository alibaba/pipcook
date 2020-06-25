import { scope, ScopeEnum, provide, async, init } from 'midway';
import { readJSON } from 'fs-extra';
import { CostaRuntime } from '@pipcook/costa';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

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
      console.warn(`read ${PIPCOOK_DAEMON_CONFIG} error: ${err.message}.`);
    }

    this.costa = new CostaRuntime({
      installDir: CoreConstants.PIPCOOK_PLUGINS,
      datasetDir: CoreConstants.PIPCOOK_DATASET,
      componentDir: CoreConstants.PIPCOOK_RUN,
      npmRegistryPrefix
    });
  }
}
