import { homedir } from 'os';
import { join } from 'path';

/**
 * The Pipcook home directory.
 */
export const PIPCOOK_HOME = join(homedir(), '.pipcook');

/**
 * The user plugins directory.
 */
export const PIPCOOK_PLUGIN_DIR = join(PIPCOOK_HOME, '/plugins');

/**
 * The datasets directory.
 */
export const PIPCOOK_DATASET_DIR = join(PIPCOOK_HOME, '/datasets');

/**
 * The runs directory.
 */
export const PIPCOOK_RUN_DIR = join(PIPCOOK_HOME, '/components');

/**
 * The PipApp directory.
 */
export const PIPCOOK_APP_DIR = join(PIPCOOK_HOME, '/apps');

/**
 * The Pipcook storage pathname.
 */
export const PIPCOOK_STORAGE = join(PIPCOOK_HOME, '/db/pipcook.db');

/**
 * The Pipcook daemon config.
 */
export const PIPCOOK_DAEMON_CONFIG = join(PIPCOOK_HOME, 'daemon.config.json');
