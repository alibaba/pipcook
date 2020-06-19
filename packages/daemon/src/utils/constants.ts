import * as os from 'os';
import * as path from 'path';

/**
 * The Pipcook home directory.
 */
export const PIPCOOK_HOME = path.join(os.homedir(), '.pipcook');

/**
 * The user plugins directory.
 */
export const PIPCOOK_PLUGIN_DIR = path.join(PIPCOOK_HOME, '/plugins');

/**
 * The datasets directory.
 */
export const PIPCOOK_DATASET_DIR = path.join(PIPCOOK_HOME, '/datasets');

/**
 * The runs directory.
 */
export const PIPCOOK_RUN_DIR = path.join(PIPCOOK_HOME, '/components');

/**
 * The PipApp directory.
 */
export const PIPCOOK_APP_DIR = path.join(PIPCOOK_HOME, '/apps');

/**
 * The Pipcook storage pathname.
 */
export const PIPCOOK_STORAGE = path.join(PIPCOOK_HOME, '/db/pipcook.db');
