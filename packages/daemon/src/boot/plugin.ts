import { scope, ScopeEnum, provide, async, init } from 'midway';
import { CostaRuntime } from '@pipcook/costa';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

@scope(ScopeEnum.Singleton)
@async()
@provide('pluginRT')
export default class PluginRuntime {
  costa: CostaRuntime;

  @init()
  async connect(): Promise<void> {
    this.costa = new CostaRuntime({
      installDir: CoreConstants.PIPCOOK_PLUGINS,
      datasetDir: CoreConstants.PIPCOOK_DATASET,
      componentDir: CoreConstants.PIPCOOK_RUN
    });
  }
}
