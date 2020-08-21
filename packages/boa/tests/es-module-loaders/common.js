/* eslint-disable no-process-exit */

'use strict';

const path = require('path');
const { test } = require('tap');
const { spawnSync } = require('child_process');

function getAbsolutePath(relativePath) {
  return path.join(__dirname, relativePath);
}

const FLAG = '--experimental-loader';
const PATH_ESM_LOADER = getAbsolutePath('../../esm/loader.mjs');

const [major, minor, patch] = process.version.replace('v', '').split('.');
if (major <= '12' && minor <= '11' && patch <= '1') {
  // See https://github.com/nodejs/node/pull/29796
  console.log(`1..0 # Skipped: Current nodejs version: ${
    process.version} does not support \`--experimental-loader\`.`);
  process.exit(0);
}

function check(t, appPath) {
  const options = { encoding: 'utf8', stdio: 'inherit' };
  const args = ['--no-warnings', FLAG, PATH_ESM_LOADER];
  // See https://github.com/nodejs/node/pull/31974
  if (process.version < 'v14.0.0') {
    args.push('--experimental-modules');
  }
  args.push(getAbsolutePath(appPath));
  // Running with tap causes errors
  // See https://github.com/tapjs/node-tap/issues/673
  // 
  // The nyc 14 conflicts with the node `--experimental-loader` design,
  // which currently uses nyc 15 and tap 14 in combination with a skip error.
  const result = spawnSync(process.execPath, args, options);
  t.strictEqual(result.signal, null);
  t.strictEqual(result.status, 0);
  t.end();
}

test('python stdlib', t => check(t, './py/test-esm-loader-stdlib.mjs'));

test('python thirdparty', t => check(t, './py/test-esm-loader-thirdparty.mjs'));

test('python custom', t => check(t, './py/test-esm-loader-custom.mjs'));

test('javascript thirdparty', t => check(t, './js/test-esm-loader-thirdparty.mjs'));

test('javascript custom', t => check(t, './js/test-esm-loader-custom.mjs'));
