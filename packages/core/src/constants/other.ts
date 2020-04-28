import * as os from 'os';
import * as path from 'path';

export const STATUS_NOT_EXECUTE = 'not execute';
export const STATUS_SUCCESS = 'success';
export const STATUS_FAILURE = 'failure';
export const STATUS_RUNNING = 'running';

export const DATA = 'data';
export const MODEL = 'model';
export const EVALUATE = 'evaluate';
export const DEPLOYMENT = 'deployment';
export const MERGE = 'merge';
export const MODELTOSAVE = 'modeltosave';
export const ORIGINDATA = 'origindata';

export const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');
export const PIPCOOK_PLUGINS = path.join(PIPCOOK_DIR, 'plugins');
export const PIPCOOK_LOGS = path.join(PIPCOOK_DIR, 'logs');