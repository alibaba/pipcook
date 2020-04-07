const childProcess = require('child_process');
const ora = require('ora');
const spinner = ora();
const {PipcookRunner} = require('@pipcook/pipcook-core');

const start = async (fileName) => {
  if (!fileName) {
    spinner.fail('Please specify the config path');
    return;
  }

  const runner = new PipcookRunner();
  runner.runConfig(fileName);
};

module.exports = start;
