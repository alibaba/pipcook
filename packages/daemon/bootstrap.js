'use strict';
const http = require('http');
const path = require('path');
const os = require('os');
const { pathExists } = require('fs-extra');
const fs = require('fs');
const { start } = require('egg');
const { execSync } = require('child_process');

const PIPCOOK_HOME = os.homedir() + '/.pipcook';
const DAEMON_PIDFILE = PIPCOOK_HOME + '/daemon.pid';
const DAEMON_CONFIG = PIPCOOK_HOME + '/daemon.config.json';
const PIPCOOK_DB = PIPCOOK_HOME + '/db/pipcook.db';

const isChildMode = typeof process.send === 'function';
const bootstrapProcessState = {
  willExit: null,
  exitCode: 0
};

let PORT = 6927;
let HOST = null;

function createPidfileSync(pathname) {
  if (fs.existsSync(DAEMON_PIDFILE)) {
    throw new TypeError(`daemon is running, please use "restart" or "stop"`);
  }
  const pid = Buffer.from(`${process.pid}\n`);
  fs.writeFileSync(pathname, pid);

  const cleanup = (code) => fs.unlinkSync(pathname);
  const unexpExit = () => process.exit(1);
  process.once('exit', (code) => {
    cleanup();
    process.exit(code);
  });
  process.once('SIGINT', unexpExit);
  process.once('SIGTERM', unexpExit);
}

(async function bootstrap() {
  // delegate the stdio to access log.
  delegateStdio();

  // create pidfile firstly
  createPidfileSync(DAEMON_PIDFILE);

  if (fs.existsSync(PIPCOOK_DB)) {
    // run migration in sub-process
    const res = execSync('npm run migration', {
      'cwd': __dirname
    });
  }

  // load config
  if (await pathExists(DAEMON_CONFIG)) {
    const config = require(DAEMON_CONFIG);
    if (config) {
      if (config.env) {
        process.env.BOA_CONDA_MIRROR = config.env.BOA_CONDA_MIRROR;
        console.info(`set env BOA_CONDA_MIRROR=${config.env.BOA_CONDA_MIRROR}`);
      }
      if (config.port) {
        PORT = config.port;
      }
      if (config.host) {
        HOST = config.host;
      }
    }
  }
  
  let midwayPathname = path.join(__dirname, 'node_modules/midway');
  if (!await pathExists(midwayPathname)) {
    midwayPathname = path.join(__dirname, '../../midway');
  }
  if (!await pathExists(midwayPathname)) {
    midwayPathname = path.join(__dirname, '../../node_modules/midway');
  }

  if (!await pathExists(midwayPathname)) {
    throw new TypeError('daemon is not installed correctly.');
  }
  const opts = {
    mode: 'single',
    baseDir: __dirname,
    framework: midwayPathname,
    typescript: true
  };

  try {
    const app = await start(opts);
    const server = http.createServer(app.callback());
    server.once('error', err => {
      exitProcessWithError(`app server got error: ${err.message}, code: ${err.code}`);
    });
    // emit `server` event in app
    app.emit('server', server);
  
    // server listen
    await new Promise(resolve => {
      if (HOST) {
        server.listen(PORT, HOST, resolve);
      } else {
        server.listen(PORT, resolve);
      }
    });
  } catch (err) {
    return exitProcessWithError(err);
  }

  process.title = 'pipcook.daemon';
  console.info('Server is listening at %s:%s, cost %ss', HOST || '0.0.0.0', PORT, process.uptime());

  prepareToReady();
})();

function exitProcessWithError(err) {
  bootstrapProcessState.willExit = true;
  bootstrapProcessState.exitCode = 1;
  console.error(err);
  // in master mode, exit directly.
  if (!isChildMode) {
    return exitProcess();
  }
}

function exitProcess() {
  return process.exit(bootstrapProcessState.exitCode)
}

function delegateStdio() {
  if (!isChildMode) {
    return;
  }
   // FIXME(Yorkie): monkeypatch the process.stdout(stderr) to redirect logs to the access log file.
  const access = fs.createWriteStream(PIPCOOK_HOME + '/daemon.access.log');
  const writeLog = (msg) => {
    if (bootstrapProcessState.willExit === true) {
      process.nextTick(() => access.write(msg, exitProcess));
    } else {
      access.write(msg);
    }
  };
  process.stdout.write = writeLog;
  process.stderr.write = writeLog;
}

function prepareToReady() {
  if (!isChildMode) {
    return;
  }
  process.send({
    event: 'ready',
    data: {
      host: HOST || '0.0.0.0',
      port: PORT,
      // for compatibility with older versions
      listen: PORT
    }
  });
}
