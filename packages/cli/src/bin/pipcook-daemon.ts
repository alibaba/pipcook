#!/usr/bin/env node

import { spawn, fork } from 'child_process';
import os from 'os';
import path from 'path';
import program from 'commander';
import { readFile, pathExists, remove } from 'fs-extra';
import { logger } from '../utils';

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
  // check if the process is running...
  if (await pathExists(DAEMON_PIDFILE)) {
    return logger.fail(`starting daemon but ${DAEMON_PIDFILE} exists.`);
  }
  logger.start('starting Pipcook...');

  const daemon = fork(path.join(DAEMON_HOME, 'bootstrap.js'), [], {
    cwd: DAEMON_HOME,
    stdio: 'ignore',
    detached: true
  });
  daemon.on('message', (message: DaemonBootstrapMessage): void => {
    if (message.event === 'ready') {
      daemon.disconnect();
      daemon.unref();
      logger.success(`Pipcook is on http://localhost:${message.data.listen}`);
    }
  });
  daemon.on('exit', async (code: number) => {
    logger.fail(`Pipcook daemon starts failed with code(${code}).`, false);
    // TODO(yorkie): check if this is local mode.
    const accessLog = path.join(PIPCOOK_HOME, 'daemon.access.log');
    console.error(await readFile(accessLog, 'utf8'));
  });
}

async function stop(): Promise<void> {
  logger.start('stoping Pipcook...');
  if (await pathExists(DAEMON_PIDFILE)) {
    const oldPid = parseInt(await readFile(DAEMON_PIDFILE, 'utf8'), 10);
    try {
      process.kill(oldPid, 'SIGINT');
      logger.success('Pipcook stoped.');
    } catch (err) {
      await remove(DAEMON_PIDFILE);
      logger.success(`kill ${oldPid} failed, skiped and removed pidfile.`);
    }
  } else {
    logger.success('skiped, daemon is not running.');
  }
}

function tail(file: string): void {
  spawn('tail', [ '-f', file ], { stdio: 'inherit' });
}

async function monitor(): Promise<void> {
  tail(`${PIPCOOK_HOME}/daemon.access.log`);
}

async function debugDaemon(): Promise<void> {
  await stop();
  process.env.DEBUG = 'costa*';
  require(path.join(DAEMON_HOME, 'bootstrap.js'));
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

program
  .command('debug')
  .description('start the pipcook daemon in foreground for debugging.')
  .action(debugDaemon);

program.parse(process.argv);
