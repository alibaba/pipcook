const fse = require('fs-extra');
const childProcess = require('child_process');
const ora = require('ora');
const path = require('path');
let {pipcookLogName} = require('./config');
const spinner = ora();

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
    fse.copySync(path.join(__dirname, '..', 'assets', 'example'), path.join(dirname, 'examples'));
    fse.ensureDirSync(path.join(dirname, pipcookLogName));

    fse.ensureDirSync(path.join(dirname, '.scripts'));
    fse.copyFileSync(path.join(__dirname, '..', 'scripts', 'image-classification.js'), 
      path.join(dirname, '.scripts', 'image-classification.js'));
    fse.copyFileSync(path.join(__dirname, '..', 'scripts', 'object-detection.js'), 
      path.join(dirname, '.scripts', 'object-detection.js'));

    
    // init npm project
    childProcess.execSync(`${client} init -y`, {
      cwd: dirname,
    });

    // try {
    //   await downloadConfig();
    //   dependencies = require(path.join(__dirname, 'temp', 'config.js')).dependencies;
    // } catch (err) {
    // }

    // for (const item of dependencies) {
    //   spinner.start(`installing ${item} ...`);
    //   childProcess.execSync(`${client} install ${item} --save`, {
    //     cwd: dirname,
    //   });
    //   spinner.succeed(`install ${item} successfully`);
    // }
    spinner.start(`installing ...`);
    childProcess.execSync(`${client} install @pipcook/pipcook-app --save`, {
      cwd: dirname,
    });
    spinner.succeed(`install successfully`);
  } catch (error) {
    spinner.fail(`install ${error} error`);
    fse.removeSync(dirname);
  }
};

module.exports = init;