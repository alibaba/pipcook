import { scope, ScopeEnum, provide, async, init } from 'midway';
import { CostaRuntime } from '@pipcook/costa';
import * as path from 'path';
import * as os from 'os';

const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');

@scope(ScopeEnum.Singleton)
@async()
@provide('pluginRT')
export default class PluginRuntime {
  costa: CostaRuntime;

  @init()
  async connect(): Promise<void> {
    this.costa = new CostaRuntime({
      installDir: path.join(PIPCOOK_DIR, 'plugins'),
      datasetDir: path.join(PIPCOOK_DIR, 'datasets'),
      componentDir: path.join(PIPCOOK_DIR, 'components')
    });
  }
}
