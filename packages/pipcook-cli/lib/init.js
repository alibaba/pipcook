const chalk = require('chalk');
const fse = require('fs-extra');
const childProcess = require('child_process');
const ora = require('ora');
const path = require('path');
let {dependencies, pipcookLogName} = require('./config');
const spinner = ora();
const request = require('request');

/**
 * install all dependencies of pipcook into working dir
 */
const init = async (cmdObj) => {
  let client = 'npm';
  if (cmdObj && cmdObj[0]) {
    client = cmdObj[0];
  }
  let dirname;
  try {
    dirname = path.join(process.cwd(), 'pipcook-project');
    if (fse.existsSync(dirname)) {
      spinner.fail(`a directory or file called 'pipcook-project' already exists. Please use a new working directory`);
      return;
    }
    fse.ensureDirSync(path.join(dirname, 'examples'));
    // we prepared several examples. Here copy these examples to current working directory
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pipeline-databinding-image-classification.js'), 
      path.join(dirname, 'examples', 'pipeline-databinding-image-classification.js'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pipeline-mnist-image-classfication.js'), 
      path.join(dirname, 'examples', 'pipeline-mnist-image-classfication.js'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pipeline-object-detection.js'), 
      path.join(dirname, 'examples', 'pipeline-object-detection.js'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'python-keras.js'), 
      path.join(dirname, 'examples', 'python-keras.js'));
    fse.ensureDirSync(path.join(dirname, pipcookLogName));
    
    // init npm project
    childProcess.execSync(`${client} init -y`, {
      cwd: dirname,
    });

    try {
      await downloadConfig();
      dependencies = require(path.join(__dirname, 'temp', 'config.js')).dependencies;
    } catch (err) {
      console.log(err);
    }

    for (const item of dependencies) {
      spinner.start(`installing ${item} ...`);
      childProcess.execSync(`${client} install ${item} --save`, {
        cwd: dirname,
      });
      spinner.succeed(`install ${item} successfully`);
    }
  } catch (error) {
    spinner.fail(`install ${error} error`);
    fse.removeSync(dirname);
  }
};

function downloadConfig() {
  fse.ensureFileSync(path.join(__dirname, 'temp', 'config.js'))
  return new Promise((resolve, reject) => {
    const file = fse.createWriteStream(path.join(__dirname, 'temp', 'config.js'));
    let receivedBytes = 0
    request.get('https://raw.githubusercontent.com/alibaba/pipcook/master/packages/pipcook-cli/lib/config.js')
      .on('response', (response) => {
        const totalBytes = response.headers['content-length'];
      })
      .on('data', (chunk) => {
        receivedBytes += chunk.length;
      })
      .pipe(file)
      .on('error', (err) => {
          fse.unlink(fileName);
          reject(err);
      });
  
    file.on('finish', () => {
      resolve();
    });
  
    file.on('error', (err) => {
      fse.unlink(fileName);
      reject(err);
    });
  })
}

module.exports = init;