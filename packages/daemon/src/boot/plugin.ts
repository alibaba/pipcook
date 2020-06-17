import { scope, ScopeEnum, provide, async, init } from 'midway';
import { CostaRuntime } from '@pipcook/costa';
import {
  PIPCOOK_PLUGIN_DIR,
  PIPCOOK_DATASET_DIR,
  PIPCOOK_RUN_DIR
} from '../utils/constants';

@scope(ScopeEnum.Singleton)
@async()
@provide('pluginRT')
export default class PluginRuntime {
  costa: CostaRuntime;

  @init()
  async connect(): Promise<void> {
    process.env.BOA_CONDA_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda';
    this.costa = new CostaRuntime({
      installDir: PIPCOOK_PLUGIN_DIR,
      datasetDir: PIPCOOK_DATASET_DIR,
      componentDir: PIPCOOK_RUN_DIR
    });
  }
}
