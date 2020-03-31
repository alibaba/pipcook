const fse = require('fs-extra');
const childProcess = require('child_process');
const ora = require('ora');
const path = require('path');
const glob = require('glob-promise');
const commandExistsSync = require('command-exists').sync;
const inquirer = require('inquirer');

const { dependencies, pipcookLogName } = require('./config');
const spinner = ora();

/**
 * install all dependencies of pipcook into working dir
 */
const init = async (cmdObj) => {
  let client = 'npm';
  if (cmdObj && cmdObj[0]) {
    client = cmdObj[0];
  } else {
    const clientChoices = [];
    if (commandExistsSync('npm')) {
      clientChoices.push('npm');
    }
    if (commandExistsSync('cnpm')) {
      clientChoices.push('cnpm');
    }
    if (commandExistsSync('tnpm')) {
      clientChoices.push('tnpm');
    }
    spinner.fail(`no npm client detected`);
    if (clientChoices.length > 0) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'client',
          message: 'which client do you want to use?',
          choices: clientChoices
        }
      ]);
      client = answer.client;
    } else {
      spinner.fail(`no npm client detected`);
      return;
    }
  }

  let dirname;
  try {
    dirname = process.cwd();

    const existingContents = await glob(path.join(dirname, '*'));
    if (existingContents.length > 0) {
      spinner.fail('Current working directory is not empty');
      return;
    }

    fse.ensureDirSync(path.join(dirname, 'examples'));
    // we prepared several examples. Here copy these examples to current working directory
    fse.copySync(path.join(__dirname, '..', 'assets', 'example'), path.join(dirname, 'examples'));
    fse.ensureDirSync(path.join(dirname, pipcookLogName));
    fse.ensureDirSync(path.join(dirname, '.server'));
    fse.copySync(path.join(__dirname, '..', 'assets', 'server'), path.join(dirname, '.server'));
 
    // init npm project
    childProcess.execSync(`${client} init -y`, {
      cwd: dirname
    });

    spinner.start(`installing pipcook`);

    for (const item of dependencies) {
      childProcess.execSync(`${client} install ${item} --save`, {
        cwd: dirname,
        stdio: 'inherit'
      });
    }
    spinner.succeed(`install pipcook core successfully`);

    spinner.start(`installing pipcook board`);
    childProcess.execSync(`${client} install`, {
      cwd: path.join(dirname, '.server'),
      stdio: 'inherit'
    });
    spinner.succeed(`install pipcook board successfully`);
  } catch (error) {
    spinner.fail(`install ${error} error`);
    childProcess.execSync(`rm -r ${path.join(dirname, '*')}`);
    childProcess.execSync(`rm -r ${path.join(dirname, '.server')}`);
  }
};

module.exports = init;
