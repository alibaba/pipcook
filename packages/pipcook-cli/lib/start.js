const chalk = require('chalk');
const fse = require('fs-extra');
const childProcess = require('child_process');
const ora = require('ora');
const path = require('path');
const {pipcookLogName} = require('./config');
const spinner = ora();


const checkValidProject = (dir) => {
  const checkPath = path.join(dir, pipcookLogName);
  if (!fse.existsSync(checkPath)) {
    console.log(
      chalk.red(
        `Current directory is not a valid working directory, please use pipcook-cli init to init a working directory firstly`
      )
    );
    return false;
  }
  return true;
}

const start = async (fileName) => {
  try {
    const currentDir = process.cwd();
    if (!checkValidProject(currentDir)) {
      return;
    }
    if (!fileName) {
      fileName = 'index.js';
    }

    const child = childProcess.spawn(`node`, [fileName], {
      cwd: currentDir,
      customFds: [0, 1, 2]
    });
    child.stdout.on('data', function (data) {   process.stdout.write(data.toString());  });
    child.stderr.on('data', function (data) {   spinner.fail(`run error: ${data.toString()}`);});
    child.on('close', function (code) { 
        console.log("Finished with code " + code);
    });
    
  } catch (err) {
    // ignore
    // spinner.fail(`run error 11: ${err}`);
  }
  

};

module.exports = start;