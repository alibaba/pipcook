'use strict';

const http = require('http');
const path = require('path');
const { start } = require('egg');
const PORT = 6927;

(async function bootstrap() {
  const opts = {
    mode: 'single',
    baseDir: path.join(__dirname),
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
})()
