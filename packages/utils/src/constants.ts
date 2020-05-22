import * as os from 'os';
import * as path from 'path';

export const PIPCOOK_PATH = {
  PIPCOOK_HOME_PATH: path.join(os.homedir(), '.pipcook'),
  PIPCOOK_PLUGINS: path.join(os.homedir(), '.pipcook', 'plugins'),
  PIPCOOK_LOGS: path.join(os.homedir(), '.pipcook', 'logs'),
  PIPCOOK_DEPENDENCIES: path.join(os.homedir(), '.pipcook', 'dependencies')
};

