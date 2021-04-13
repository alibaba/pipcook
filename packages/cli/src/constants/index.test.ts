import test from 'ava';
import * as path from 'path';
import { homedir } from 'os';
import * as constants from './';

test('constants of cli', (t) => {
  t.is(constants.PIPCOOK_FRAMEWORK_MIRROR_BASE, 'https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/');
  t.is(constants.FrameworkDescFilename, 'framework.json');
  t.is(constants.PIPCOOK_PLUGIN_ARTIFACT_PATH, path.join(constants.PIPCOOK_HOME_PATH, 'artifact'));
  t.is(constants.PIPCOOK_HOME_PATH, path.join(homedir(), '.pipcook'));
  t.is(constants.PIPCOOK_TMPDIR, path.join(constants.PIPCOOK_HOME_PATH, '.tmp'));
  t.is(constants.PIPCOOK_FRAMEWORK_PATH, path.join(constants.PIPCOOK_HOME_PATH, 'framework'));
  t.is(constants.PIPCOOK_SCRIPT_PATH, path.join(constants.PIPCOOK_HOME_PATH, 'script'));
});
