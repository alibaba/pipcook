#!/usr/bin/env node

import { execSync as exec, spawn, fork } from 'child_process';
import os from 'os';
import path from 'path';
import program from 'commander';
import { readFile, pathExists } from 'fs-extra';

const PIPCOOK_HOME = path.join(os.homedir(), '.pipcook');
const DAEMON_HOME = path.join(PIPCOOK_HOME, 'server/node_modules/@pipcook/daemon');
const DAEMON_PIDFILE = path.join(PIPCOOK_HOME, 'daemon.pid');

type DaemonOperator = 'start' | 'stop';

async function start(): Promise<void> {
  const daemon = fork(path.join(DAEMON_HOME, 'bootstrap.js'), [], {
    cwd: DAEMON_HOME,
    stdio: [ 0, 'pipe', 'pipe', 'ipc' ],
    detached: true
  });
  const pipe = (channel: 'stdout' | 'stderr') => daemon[channel].pipe(process[channel]);
  const unpipe = (channel: 'stdout' | 'stderr') => daemon[channel].unpipe(process[channel]);

  // [ 'stdout', 'stderr' ].map(pipe);
  daemon.on('message', (event: string) => {
    if (event === 'ready') {
      [ 'stdout', 'stderr' ].map(unpipe);
      daemon.removeAllListeners('message');
      daemon.disconnect();
      daemon.unref();
    }
  });
}

async function stop(): Promise<void> {
  if (await pathExists(DAEMON_PIDFILE)) {
    const oldPid = parseInt(await readFile(DAEMON_PIDFILE, 'utf8'), 10);
    exec(`kill ${oldPid}`);
  } else {
    console.error('daemon is not running.');
  }
}

function tail(file: string): void {
  spawn('tail', [ '-f', file ], { stdio: 'inherit' });
}

async function monitor(): Promise<void> {
  tail(`${PIPCOOK_HOME}/daemon.stdout.log`);
  tail(`${PIPCOOK_HOME}/daemon.stderr.log`);
}

program
  .command('start')
  .description('start the pipcook daemon.')
  .action(start);

program
  .command('restart')
  .description('restart pipcook daemon')
  .action(async () => {
    await stop();
    await start();
  });

program
  .command('stop')
  .description('stop the pipcook daemon.')
  .action(stop);

program
  .command('monit')
  .description('monit the daemon logs.')
  .action(monitor);

program.parse(process.argv);
