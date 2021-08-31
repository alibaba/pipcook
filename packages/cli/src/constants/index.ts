import { homedir } from 'os';
import { join } from 'path';

/**
 * Pipcook home directory.
 */
export const PIPCOOK_HOME_PATH = join(homedir(), '.pipcook');

/**
 * Pipcook temp directory
 */
export const PIPCOOK_TMPDIR = join(PIPCOOK_HOME_PATH, '.tmp');

/**
 * pipcook framework cache
 */
export const PIPCOOK_FRAMEWORK_PATH = join(PIPCOOK_HOME_PATH, 'framework');

/**
 * pipcook script cache
 */
export const PIPCOOK_SCRIPT_PATH = join(PIPCOOK_HOME_PATH, 'script');

/**
 * pipcook artifact plugin path
 */
export const PIPCOOK_PLUGIN_ARTIFACT_PATH = join(PIPCOOK_HOME_PATH, 'artifact');

/**
 * pipcook framework mirror url
 */
export const PIPCOOK_FRAMEWORK_MIRROR_BASE = 'https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/';

/**
 * framework description file name, which is located in the root directory of the framework package
 */
export const FrameworkDescFilename = 'framework.json';

/**
 * framework description filename, which is located in the root directory of the framework package
 */
export const JSDescFilename = 'package.json';

/**
 * Node module directory name in the framework directory.
 */
export const JSModuleDirName = 'node_modules';

/**
 * Pipeline file name in the model directory.
 */
export const PipelineFileInModelDir = 'pipeline.json';

/**
 * Model directory name in the workspace directory.
 */
export const WorkspaceModelDir = 'model';

/**
 * Script directory name in the workspace directory.
 */
export const WorkspaceScriptDir = 'scripts';

/**
 * Framework directory name in the workspace directory.
 */
export const WorkspaceFrameworkDir = 'framework';

/**
 * Data directory name in the workspace directory.
 */
export const WorkspaceDataDir = 'data';

export const WorkspaceCacheDir = 'cache';
