import { homedir } from 'os';
import { join } from 'path';

/**
 * Pipcook home directory.
 */
export const PIPCOOK_HOME_PATH = join(homedir(), '.pipcook');

/**
 * Pipcook user installed plugins.
 */
export const PIPCOOK_PLUGINS = join(PIPCOOK_HOME_PATH, 'plugins');

/**
 * Pipcook logs, deprecated.
 */
export const PIPCOOK_LOGS = join(PIPCOOK_HOME_PATH, 'logs');

/**
 * Pipcook daemon directory.
 */
export const PIPCOOK_DAEMON = join(PIPCOOK_HOME_PATH, 'server');

/**
 * Pipcook Daemon dep boa directory
 */
export const PIPCOOK_BOA = join(PIPCOOK_DAEMON, 'node_modules/@pipcook/boa');

/**
 * Pipcook Boa dep miniconda lib directory
 */
export const PIPCOOK_MINICONDA_LIB = join(PIPCOOK_BOA, '.miniconda/lib');

/**
 * Pipcook daemon source directory.
 */
export const PIPCOOK_DAEMON_SRC = join(PIPCOOK_DAEMON, 'node_modules/@pipcook/daemon');

/**
 * Pipcook daemon public directory.
 */
export const PIPCOOK_DAEMON_PUBLIC = join(PIPCOOK_DAEMON_SRC, 'src/app/public');

/**
 * The Pipcook daemon config.
 */
export const PIPCOOK_DAEMON_CONFIG = join(PIPCOOK_HOME_PATH, 'daemon.config.json');

/**
 * Pipboard directory.
 */
export const PIPCOOK_BOARD = join(PIPCOOK_HOME_PATH, 'pipboard');

/**
 * Pipcook build source directory.
 */
export const PIPCOOK_BOARD_SRC = join(PIPCOOK_BOARD, 'node_modules/@pipcook/pipboard');

/**
 * Pipboard build assets.
 */
export const PIPCOOK_BOARD_BUILD = join(PIPCOOK_BOARD_SRC, 'build');

/**
 * Pipcook TMPDIR.
 */
export const PIPCOOK_TMPDIR = process.env.TMPDIR || join(PIPCOOK_HOME_PATH, '.tmp');

/**
 * keras directory to store pre-trained models.
 */
export const KERAS_DIR = join(homedir(), '.keras');

/**
 * torch directory to store pre-trained models.
 */
export const TORCH_DIR = join(homedir(), '.torch');

/**
 * The datasets directory.
 */
export const PIPCOOK_DATASET = join(PIPCOOK_HOME_PATH, '/datasets');

/**
 * The runs directory.
 */
export const PIPCOOK_RUN = join(PIPCOOK_HOME_PATH, '/components');

/**
 * The PipApp directory.
 */
export const PIPCOOK_APP = join(PIPCOOK_HOME_PATH, '/apps');

/**
 * The Pipcook storage pathname.
 */
export const PIPCOOK_STORAGE = join(PIPCOOK_HOME_PATH, '/db/pipcook.db');

/**
 * Output types
 */
export const enum OutputType {
  Data = 'data',
  Model = 'model',
  Evaluate = 'evaluate',
  Merge = 'merge',
  ModelToSave = 'modeltosave',
  OriginData = 'origindata',
  NotSet = 'not set'
}
