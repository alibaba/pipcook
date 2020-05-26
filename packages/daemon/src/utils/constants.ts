import * as os from 'os';
import * as path from 'path';

export const PIPCOOK_HOME = path.join(os.homedir(), '.pipcook');
export const PIPCOOK_PLUGIN_DIR = PIPCOOK_HOME + '/plugins';
export const PIPCOOK_DATASET_DIR = PIPCOOK_HOME + '/datasets';
export const PIPCOOK_RUN_DIR = PIPCOOK_HOME + '/components';
export const PIPCOOK_STORAGE = PIPCOOK_HOME + '/db/pipcook.db';
