import * as os from 'os';
import * as path from 'path';

export const STATUS_NOT_EXECUTE = 'not execute';
export const STATUS_SUCCESS = 'success';
export const STATUS_FAILURE = 'failure';
export const STATUS_RUNNING = 'running';

export const PIPCOOK_HOME_PATH = path.join(os.homedir(), '.pipcook');
export const PIPCOOK_PLUGINS = path.join(PIPCOOK_HOME_PATH, 'plugins');
export const PIPCOOK_LOGS = path.join(PIPCOOK_HOME_PATH, 'logs');

export const enum OutputType {
  Data = 'data',
  Model = 'model',
  Evaluate = 'evaluate',
  Merge = 'merge',
  ModelToSave = 'modeltosave',
  OriginData = 'origindata',
  NotSet = 'not set'
}
