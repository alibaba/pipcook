import { Application } from 'midway';
import { createPluginRuntime } from './utils/plugin';
import * as path from 'path';
import * as os from 'os';

const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');

export default class AppBootHook {
  app: Application;

  constructor(app) {
    this.app = app;
  }
  willReady() {
    createPluginRuntime({
      installDir: path.join(PIPCOOK_DIR, 'plugins'),
      datasetDir: path.join(PIPCOOK_DIR, 'datasets'),
      componentDir: path.join(PIPCOOK_DIR, 'components')
    });
  }
}
