const childProcess = require('child_process');
const ora = require('ora');
const spinner = ora();
const {PipcookRunner} = require('@pipcook/pipcook-core');

const start = async (fileName) => {
  if (!fileName) {
    spinner.fail('Please specify the config path');
    return;
  }

  childProcess.execSync(`${client} init -y`, {
    cwd: dirname
  });

  const runner = new PipcookRunner();
  runner.runConfig(fileName);
};

module.exports = start;
