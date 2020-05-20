#!/usr/bin/env node

import program from 'commander';
import { execSync as exec } from 'child_process';
import * as os from 'os';
import path from 'path';

const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');
const DAEMON_DIR = path.join(PIPCOOK_DIR, 'server');
const DAEMON_PORT = 6927;

type DaemonOperator = 'start' | 'stop';

function execEggScript(op: DaemonOperator, args: string[]): void {
  const bin = DAEMON_DIR + '/node_modules/@pipcook/daemon/node_modules/.bin/egg-scripts';
  const command = [ bin, op ].concat(args).join(' ');
  console.info('>', command);
  exec(command, {
    cwd: DAEMON_DIR + '/node_modules/@pipcook/daemon'
  });
}

function startDaemon() {
  return execEggScript('start', [
    '--daemon', '--ts',
    '--title=pipcook-daemon',
    '--framework=midway',
    `--port=${DAEMON_PORT}`,
    `--stdout=${PIPCOOK_DIR}/daemon/stdout.log`,
    `--stderr=${PIPCOOK_DIR}/deamon/stderr.log`,
    '--ignore-stderr'
  ]);
}

function stopDaemon() {
  return execEggScript('stop', [ '--title=pipcook-daemon' ]);
}

program
  .command('start')
  .action(startDaemon);

program
  .command('stop')
  .action(stopDaemon);

program.parse(process.argv);
