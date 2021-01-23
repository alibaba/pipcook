'use strict';
import * as os from 'os';
import {
  pathExists,
  mkdirp,
  readJSON,
  writeFile,
  removeSync,
  createWriteStream
} from 'fs-extra';
import { exec } from 'child_process';
import { DaemonApplication, ApplicationConfig } from './application';

const PIPCOOK_HOME = os.homedir() + '/.pipcook';
const DAEMON_PIDFILE = PIPCOOK_HOME + '/daemon.pid';
const DAEMON_CONFIG = PIPCOOK_HOME + '/daemon.config.json';
const PIPCOOK_DB_DIR = PIPCOOK_HOME + '/db';
// const PIPCOOK_DB = PIPCOOK_DB_DIR + '/pipcook.db';

const isChildMode = process.send;
const bootstrapProcessState = {
  willExit: false,
  exitCode: 0
};

export async function readConfig(): Promise<{
  appConfig: ApplicationConfig,
  env: Record<string, string>
}> {
  let port = 6927;
  let host = '0.0.0.0';
  let env: Record<string, string> = {};
  // load config
  if (await pathExists(DAEMON_CONFIG)) {
    const config = await readJSON(DAEMON_CONFIG);
    if (config?.env) {
      env.BOA_CONDA_MIRROR = config.env.BOA_CONDA_MIRROR;
      console.info(`set env BOA_CONDA_MIRROR=${config.env.BOA_CONDA_MIRROR}`);
    }
    port = config?.port || port;
    host = config?.host || host;
  }
  return {
    appConfig: {
      rest: {
        port,
        host,
        // The `gracePeriodForClose` provides a graceful close for http/https
        // servers with keep-alive clients. The default value is `Infinity`
        // (don't force-close). If you want to immediately destroy all sockets
        // upon stop, set its value to `0`.
        // See https://www.npmjs.com/package/stoppable
        gracePeriodForClose: 5000,
        openApiSpec: {
          // useful when used with OpenAPI-to-GraphQL to locate your application
          setServersFromRequest: true
        }
      }
    },
    env
  };
}

async function createPidfileSync(pathname: string): Promise<void> {
  if (await pathExists(DAEMON_PIDFILE)) {
    throw new TypeError(`daemon is running, please use "restart" or "stop"`);
  }
  const pid = Buffer.from(`${process.pid}\n`);
  await writeFile(pathname, pid);

  const cleanup = () => removeSync(pathname);
  const unexpExit = () => process.exit(1);
  process.once('exit', (code) => {
    cleanup();
    process.exit(code);
  });
  process.once('SIGINT', unexpExit);
  process.once('SIGTERM', unexpExit);
}


function exitProcessWithError(err: Error): void {
  bootstrapProcessState.willExit = true;
  bootstrapProcessState.exitCode = 1;
  console.error(err);
  // in master mode, exit directly.
  if (!isChildMode) {
    return exitProcess();
  }
}

function exitProcess(): void {
  return process.exit(bootstrapProcessState.exitCode);
}

function delegateStdio(): void {
  if (!isChildMode) {
    return;
  }
  // FIXME(Yorkie): monkeypatch the process.stdout(stderr) to redirect logs to the access log file.
  const access = createWriteStream(PIPCOOK_HOME + '/daemon.access.log');
  const writeLog = (buffer: string | Buffer): void => {
    if (bootstrapProcessState.willExit === true) {
      process.nextTick(() => access.write(buffer, exitProcess));
    } else {
      access.write(buffer);
    }
  };
  process.stdout.write = writeLog as any;
  process.stderr.write = writeLog as any;
}

function prepareToReady(host: string, port: number): void {
  // FIXME(feely): ts error here if we use `isChildMode`
  if (process.send) {
    process.send({
      event: 'ready',
      data: {
        host,
        port
      }
    });
  }
}

export async function main(): Promise<void> {
  // delegate the stdio to access log.
  delegateStdio();

  // create pidfile firstly
  await createPidfileSync(DAEMON_PIDFILE);
  await mkdirp(PIPCOOK_DB_DIR);
  // run migration in sub-process
  await exec('npm run migrate', {
    'cwd': __dirname
  });
  const { appConfig, env } = await readConfig();
  process.env = Object.assign(env, process.env);
  // start loopback application
  try {
    const app = new DaemonApplication(appConfig);
    await app.boot();
    await app.start();
  } catch (err) {
    exitProcessWithError(err);
  }
  process.title = 'pipcook.daemon';
  console.info('Server is listening at %s:%s, cost %ss', appConfig.rest.host, appConfig.rest.port, process.uptime());

  prepareToReady(appConfig.rest.host, appConfig.rest.port);
}

if (require.main === module) {
  main();
}
