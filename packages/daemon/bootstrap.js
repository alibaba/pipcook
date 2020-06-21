'use strict';

const http = require('http');
const path = require('path');
const os = require('os');
const { pathExists } = require('fs-extra');
const fs = require('fs');
const { start } = require('egg');

const PIPCOOK_HOME = os.homedir() + '/.pipcook';
const DAEMON_PIDFILE = PIPCOOK_HOME + '/daemon.pid';
const DAEMON_CONFIG = PIPCOOK_HOME + '/daemon.config.json';
const PORT = 6927;

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
  // create pidfile firstly
  createPidfileSync(DAEMON_PIDFILE);

  // load config
  if (await pathExists(DAEMON_CONFIG)) {
    const config = require(DAEMON_CONFIG);
    if (config && config.env) {
      process.env.BOA_CONDA_MIRROR = config.env.BOA_CONDA_MIRROR;
      console.info(`set env BOA_CONDA_MIRROR=${config.env.BOA_CONDA_MIRROR}`);
    }
  }

  let midwayPathname = path.join(__dirname, 'node_modules/midway');
  if (!await pathExists(midwayPathname)) {
    midwayPathname = path.join(__dirname, '../../midway');
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
  const app = await start(opts);

  const server = http.createServer(app.callback());
  server.once('error', err => {
    console.error('app server got error: %s, code: %s', err.message, err.code);
    process.exit(1);
  });

  // emit `server` event in app
  app.emit('server', server);

  // server listen
  await new Promise(resolve => {
    server.listen(PORT, resolve);
  });

  process.title = 'pipcook.daemon';
  console.info('Server is listening at http://localhost:%s, cost %ss', PORT, process.uptime());

  if (typeof process.send === 'function') {
    prepareToReady();
  }
})();

function prepareToReady() {
  // FIXME(Yorkie): monkeypatch the process.stdout(stderr) to redirect logs to the access log file.
  const access = fs.createWriteStream(PIPCOOK_HOME + '/daemon.access.log')
  process.stdout.write = access.write.bind(access);
  process.stderr.write = access.write.bind(access);
  process.send({
    event: 'ready',
    data: {
      listen: PORT
    }
  });
}