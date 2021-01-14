'use strict';
const { spawn } = require('child_process');
const { join } = require('path');

const start = Date.now();
const child = spawn('node', [ join(__dirname, '../bootstrap.js') ]);
let output = '';
let isStartup = false;
child.stdout.on('data', (data) => {
  output += data.toString();
  if (output.indexOf('Server is listening at') >= 0) {
    isStartup = true;
    console.log(`daemon startup cost ${Date.now() - start} ms`);
    child.kill();
  }
});

child.on('error', (err) => {
  console.error(`daemon start error: ${err.message}`);
});
child.on('close', () => {
  if (!isStartup) {
    console.error('daemon start failed');
  }
});
