const fork = require('child_process').fork;
const ora = require('ora');
const spinner = ora();
const path = require('path');

const start = async (fileName) => {
  if (!fileName) {
    spinner.fail('Please specify the config path');
    return;
  }

  const childProcess = fork(path.join(__dirname, 'runConfig.js'), {
    cwd: process.cwd(),
    env: {
      NODE_PATH: path.join(process.cwd(), 'node_modules')
    }
  });
  childProcess.send(fileName);
};

module.exports = start;
