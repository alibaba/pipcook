import { homedir } from 'os';
import { join } from 'path';

/**
 * Pipcook home directory.
 */
export const PIPCOOK_HOME_PATH = join(homedir(), '.pipcook');

/**
 * Pipcook temp directory
 */
export const PIPCOOK_TMPDIR = process.env.TMPDIR || join(PIPCOOK_HOME_PATH, '.tmp');
