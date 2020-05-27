'use strict';

const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { start } = require('egg');

const PIPCOOK_HOME = os.homedir() + '/.pipcook';
const DAEMON_PIDFILE = PIPCOOK_HOME + '/daemon.pid';
const PORT = 6927;

function createPidfileSync(pathname) {
  if (fs.existsSync(DAEMON_PIDFILE)) {
    throw new TypeError(`daemon is running, please use "restart" or "stop"`);
  }
  const pid = Buffer.from(`${process.pid}\n`);
  const fd = fs.openSync(pathname, 'w');
  let offset = 0;
  while (offset < pid.length) {
    offset += fs.writeSync(fd, pid, offset, pid.length - offset);
  }
  fs.closeSync(fd);

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

  const opts = {
    mode: 'single',
    baseDir: __dirname,
    framework: path.join(__dirname, './node_modules/midway'),
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
  process.stdout.pipe(
    fs.createWriteStream(PIPCOOK_HOME + '/daemon.stdout.log'));
  process.stderr.pipe(
    fs.createWriteStream(PIPCOOK_HOME + '/daemon.stderr.log'));
  process.send('ready');
}