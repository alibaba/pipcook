const { fork } = require('child_process');
const ora = require('ora');

const spinner = ora();
const path = require('path');

const start = async (filename) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return;
  }

  const script = path.join(__dirname, 'runConfig.js');
  const child = fork(script, [ filename ], {
    cwd: process.cwd(),
    env: {
      NODE_PATH: path.join(process.cwd(), 'node_modules')
    },
    stdio: 'inherit'
  });
  child.on('exit', (code) => {
    process.exit(code);
  });
};

module.exports = start;
