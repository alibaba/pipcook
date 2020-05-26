#!/usr/bin/env node

import { execSync as exec, spawn } from 'child_process';
import os from 'os';
import path from 'path';
import program from 'commander';
import { remove } from 'fs-extra';

const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');
const DAEMON_DIR = path.join(PIPCOOK_DIR, 'server');
const DAEMON_PORT = 6927;

type DaemonOperator = 'start' | 'stop';

function execEggScript(op: DaemonOperator, args: string[]): void {
  const bin = path.join(__dirname, '../../node_modules/.bin/egg-scripts');
  const command = [ bin, op ].concat(args).join(' ');
  console.info('>', command);
  exec(command, {
    cwd: `${DAEMON_DIR}/node_modules/@pipcook/daemon`
  });
}

async function start(): Promise<void> {
  return execEggScript('start', [
    '--daemon',
    '--ts',
    '--title=pipcook-daemon',
    '--framework=midway',
    '--workers=1',
    `--port=${DAEMON_PORT}`,
    `--stdout=${PIPCOOK_DIR}/daemon/stdout.log`,
    `--stderr=${PIPCOOK_DIR}/daemon/stderr.log`,
    '--ignore-stderr'
  ]);
}

async function stop(): Promise<void> {
  await remove(`${PIPCOOK_DIR}/daemon`);
  return execEggScript('stop', [ '--title=pipcook-daemon' ]);
}

function tail(file: string): void {
  spawn('tail', [ '-f', file ], { stdio: 'inherit' });
}

async function monitor(): Promise<void> {
  tail(`${PIPCOOK_DIR}/daemon/stdout.log`);
  tail(`${PIPCOOK_DIR}/daemon/stderr.log`);
}

program
  .command('start')
  .description('start the pipcook daemon.')
  .action(start);

program
  .command('stop')
  .description('stop the pipcook daemon.')
  .action(stop);

program
  .command('monit')
  .description('monit the daemon logs.')
  .action(monitor);

program.parse(process.argv);
