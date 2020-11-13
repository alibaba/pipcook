"use strict";
exports.__esModule = true;
exports.PIPCOOK_STORAGE = exports.PIPCOOK_APP = exports.PIPCOOK_RUN = exports.PIPCOOK_DATASET = exports.TORCH_DIR = exports.KERAS_DIR = exports.PIPCOOK_TMPDIR = exports.PIPCOOK_BOARD_BUILD = exports.PIPCOOK_BOARD_SRC = exports.PIPCOOK_BOARD = exports.PIPCOOK_DAEMON_CONFIG = exports.PIPCOOK_DAEMON_PUBLIC = exports.PIPCOOK_DAEMON_SRC = exports.PIPCOOK_DAEMON = exports.PIPCOOK_LOGS = exports.PIPCOOK_PLUGINS = exports.PIPCOOK_HOME_PATH = void 0;
var os_1 = require("os");
var path_1 = require("path");
/**
 * Pipcook home directory.
 */
exports.PIPCOOK_HOME_PATH = path_1.join(os_1.homedir(), '.pipcook');
/**
 * Pipcook user installed plugins.
 */
exports.PIPCOOK_PLUGINS = path_1.join(exports.PIPCOOK_HOME_PATH, 'plugins');
/**
 * Pipcook logs, deprecated.
 */
exports.PIPCOOK_LOGS = path_1.join(exports.PIPCOOK_HOME_PATH, 'logs');
/**
 * Pipcook daemon directory.
 */
exports.PIPCOOK_DAEMON = path_1.join(exports.PIPCOOK_HOME_PATH, 'server');
/**
 * Pipcook daemon source directory.
 */
exports.PIPCOOK_DAEMON_SRC = path_1.join(exports.PIPCOOK_DAEMON, 'node_modules/@pipcook/daemon');
/**
 * Pipcook daemon public directory.
 */
exports.PIPCOOK_DAEMON_PUBLIC = path_1.join(exports.PIPCOOK_DAEMON_SRC, 'src/app/public');
/**
 * The Pipcook daemon config.
 */
exports.PIPCOOK_DAEMON_CONFIG = path_1.join(exports.PIPCOOK_HOME_PATH, 'daemon.config.json');
/**
 * Pipboard directory.
 */
exports.PIPCOOK_BOARD = path_1.join(exports.PIPCOOK_HOME_PATH, 'pipboard');
/**
 * Pipcook build source directory.
 */
exports.PIPCOOK_BOARD_SRC = path_1.join(exports.PIPCOOK_BOARD, 'node_modules/@pipcook/pipboard');
/**
 * Pipboard build assets.
 */
exports.PIPCOOK_BOARD_BUILD = path_1.join(exports.PIPCOOK_BOARD_SRC, 'build');
/**
 * Pipcook TMPDIR.
 */
exports.PIPCOOK_TMPDIR = process.env.TMPDIR || path_1.join(exports.PIPCOOK_HOME_PATH, '.tmp');
/**
 * keras directory to store pre-trained models.
 */
exports.KERAS_DIR = path_1.join(os_1.homedir(), '.keras');
/**
 * torch directory to store pre-trained models.
 */
exports.TORCH_DIR = path_1.join(os_1.homedir(), '.torch');
/**
 * The datasets directory.
 */
exports.PIPCOOK_DATASET = path_1.join(exports.PIPCOOK_HOME_PATH, '/datasets');
/**
 * The runs directory.
 */
exports.PIPCOOK_RUN = path_1.join(exports.PIPCOOK_HOME_PATH, '/components');
/**
 * The PipApp directory.
 */
exports.PIPCOOK_APP = path_1.join(exports.PIPCOOK_HOME_PATH, '/apps');
/**
 * The Pipcook storage pathname.
 */
exports.PIPCOOK_STORAGE = path_1.join(exports.PIPCOOK_HOME_PATH, '/db/pipcook.db');
