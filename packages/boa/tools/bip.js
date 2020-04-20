#!/usr/bin/env node
const fs = require('fs');
const { run, getCondaPath } = require('./utils');

const args = process.argv.slice(2).join(' ');
const condaPath = getCondaPath();
if (fs.existsSync(condaPath)) {
  run(`${condaPath}/bin/pip`, args);
}

