#!/usr/bin/env node

import { spawn, fork } from 'child_process';
import path from 'path';
import program from 'commander';
import { readFile, pathExists, remove } from 'fs-extra';
import { constants } from '@pipcook/pipcook-core';
import { logger } from '../utils/common';

const PIPCOOK_HOME = constants.PIPCOOK_HOME_PATH;
const DAEMON_HOME = constants.PIPCOOK_DAEMON_SRC;
const ACCESS_LOG = path.join(PIPCOOK_HOME, 'daemon.access.log');
const DAEMON_PIDFILE = path.join(PIPCOOK_HOME, 'daemon.pid');
const BOOTSTRAP_HOME = path.join(DAEMON_HOME, 'bootstrap.js');

interface DaemonBootstrapMessage {
  event: string;
  data: {
    host: string;
    port: number;
    /**
     * deprecated feild
     */
    listen: number;
  };
}

async function start(): Promise<void> {
  // check if the process is running...
  if (await pathExists(DAEMON_PIDFILE)) {
    return logger.fail(`starting daemon but ${DAEMON_PIDFILE} exists.`);
  }
  logger.start('starting Pipcook...');

  const daemon = fork(BOOTSTRAP_HOME, [], {
    cwd: DAEMON_HOME,
    stdio: 'ignore',
    detached: true
  });
  daemon.on('message', (message: DaemonBootstrapMessage): void => {
    if (message.event === 'ready') {
      daemon.disconnect();
      daemon.unref();
      let serverInfo;
      // TODO(Feely): the listen field is deprecated, we will remove this
      if (message.data.listen) {
        serverInfo = message.data.listen;
      } else if (message.data.host && message.data.port) {
        serverInfo = `${message.data.host}:${message.data.port}`;
      }
      logger.success(`Pipcook service started on ${serverInfo}. To open pipboard, please visit https://pipboard.vercel.app`);
    }
  });
  daemon.on('exit', async (code: number) => {
    logger.fail(`Pipcook daemon starts failed with code(${code}).`, false);
    // TODO(yorkie): check if this is local mode.
    if (await pathExists(ACCESS_LOG)) {
      logger.fail(await readFile(ACCESS_LOG, 'utf8'));
    } else {
      logger.fail('unknown error');
    }
  });
}

async function stop(): Promise<void> {
  logger.start('stoping Pipcook...');
  if (await pathExists(DAEMON_PIDFILE)) {
    const oldPid = parseInt(await readFile(DAEMON_PIDFILE, 'utf8'), 10);
    try {
      process.kill(oldPid, 'SIGINT');
      logger.success('Pipcook stopped.');
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
  tail(ACCESS_LOG);
}

async function debugDaemon(): Promise<void> {
  await stop();
  process.env.DEBUG = 'costa*';
  require(BOOTSTRAP_HOME);
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
    console.info(ACCESS_LOG);
  });

program
  .command('debug')
  .description('start the pipcook daemon in foreground for debugging.')
  .action(debugDaemon);

program.parse(process.argv);
