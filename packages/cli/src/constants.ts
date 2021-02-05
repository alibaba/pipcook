import { join } from 'path';
import { constants } from '@pipcook/pipcook-core';
/**
 * Pipcook Daemon dep boa directory
 */
export const PIPCOOK_BOA = join(constants.PIPCOOK_DAEMON, 'node_modules/@pipcook/boa');

/**
 * Pipcook Boa dep miniconda lib directory
 */
export const PIPCOOK_MINICONDA_LIB = join(PIPCOOK_BOA, '.miniconda/lib');
