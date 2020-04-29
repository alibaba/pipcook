import { execSync } from 'child_process';
import path from 'path';

const cli_dir = path.join(__dirname, '../../dist/bin/index.js');

function exec(cmd: string): string {
  const result = execSync(`${cli_dir} ${cmd}`);
  console.log(`run: ${cli_dir} ${cmd}`);
  console.log('>>>> ', result.toString());

  return result.toString();
}

import assert from 'assert';

describe('Run pipcook cli', () => {
  it('version', () => {
    const pkg = require('../../package.json');
    assert.equal(exec('-v').split('\n')[0], pkg.version);
  });

  it('init help', () => {
    assert.notEqual(exec('init --help').includes('Usage: index init [options]'), false);
  });

  it('run help', () => {
    assert.notEqual(exec('run --help').includes('Usage: index run [options] [fileName]'), false);
  });

  it('log help', () => {
    assert.notEqual(exec('log --help').includes('Usage: index log [options]'), false);
  });

  it('board help', () => {
    assert.notEqual(exec('board --help').includes('Usage: index board [options]'), false);
  });

  it('plugin-dev help', () => {
    assert.notEqual(exec('plugin-dev --help').includes('Usage: index plugin-dev [options]'), false);
  });

  it('dataset help', () => {
    assert.notEqual(exec('dataset --help').includes('Usage: index dataset [options]'), false);
  });

  it('bip help', () => {
    assert.notEqual(exec('bip --help').includes('Usage: index bip [options]'), false);
  });

  it('serve help', () => {
    assert.notEqual(exec('serve --help').includes('Usage: index serve [options] <dir>'), false);
  });
});
