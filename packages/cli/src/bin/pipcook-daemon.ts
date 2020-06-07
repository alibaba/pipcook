#!/usr/bin/env node

import { execSync as exec, spawn, fork } from 'child_process';
import os from 'os';
import path from 'path';
import program from 'commander';
import { readFile, pathExists, remove } from 'fs-extra';
import { ora } from '../utils';

const PIPCOOK_HOME = path.join(os.homedir(), '.pipcook');
const DAEMON_HOME = path.join(PIPCOOK_HOME, 'server/node_modules/@pipcook/daemon');
const DAEMON_PIDFILE = path.join(PIPCOOK_HOME, 'daemon.pid');

interface DaemonBootstrapMessage {
  event: string;
  data: {
    listen: number;
  };
}

async function start(): Promise<void> {
  const spinner = ora();
  spinner.start('starting Pipcook...');

  const daemon = fork(path.join(DAEMON_HOME, 'bootstrap.js'), [], {
    cwd: DAEMON_HOME,
    stdio: 'ignore',
    detached: true
  });
  daemon.on('message', (message: DaemonBootstrapMessage): void => {
    if (message.event === 'ready') {
      daemon.disconnect();
      daemon.unref();
      spinner.succeed(`Pipcook is on http://localhost:${message.data.listen}`);
    }
  });
}

async function stop(): Promise<void> {
  const spinner = ora();
  spinner.start('stoping Pipcook...');
  if (await pathExists(DAEMON_PIDFILE)) {
    const oldPid = parseInt(await readFile(DAEMON_PIDFILE, 'utf8'), 10);
    try {
      exec(`kill ${oldPid}`);
      spinner.succeed('Pipcook stoped.');
    } catch (err) {
      await remove(DAEMON_PIDFILE);
      spinner.succeed(`kill ${oldPid} failed, skiped and removed pidfile.`);
    }
  } else {
    spinner.succeed('skiped, daemon is not running.');
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

program
  .command('logfile')
  .description('print the path of logfile')
  .action(() => {
    console.info(PIPCOOK_HOME + '/daemon.access.log');
  });

program.parse(process.argv);
