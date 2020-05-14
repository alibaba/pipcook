import * as os from 'os';
import * as path from 'path';

export const PIPCOOK_HOME = path.join(os.homedir(), '.pipcook');
export const DB_PATH = path.join(PIPCOOK_HOME, 'db', 'pipcook.db');
export const DEPENDENCY_PATH = path.join(PIPCOOK_HOME, 'dependencies');
export const MODULE_PATH = path.join(DEPENDENCY_PATH, 'node_modules');
