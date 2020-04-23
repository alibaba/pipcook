const chalk = require('chalk');
const fse = require('fs-extra');
const ora = require('ora');
const childProcess = require('child_process');
const path = require('path');
const spinner = ora();
const debugLog = require('debug')('cli/board');

module.exports = () => {
  try {
    if (!fse.existsSync(path.join(process.cwd(), '.server'))) {
      spinner.fail('Please init the project firstly');
      return;
    }

    childProcess.execSync(`cd .server && npm run dev`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (e) {
    debugLog(chalk.red(e));
  }
};
