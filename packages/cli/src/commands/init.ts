import path from 'path';
import childProcess from 'child_process';
import fse from 'fs-extra';
import ora from 'ora';
import { prompt } from 'inquirer';
import { sync } from 'command-exists';
import * as os from 'os';

import { InitCommandHandler } from '../types';
import { dependencies, optionalNpmClients } from '../config';

const spinner = ora();

/**
 * install all dependencies of pipcook into working dir
 */
export const init: InitCommandHandler = async ({ client, beta, tuna }) => {
  let npmClient = 'npm';
  const npmInstallEnvs = Object.assign({}, process.env);
  if (tuna) {
    npmInstallEnvs.BOA_CONDA_INDEX = 'https://pypi.tuna.tsinghua.edu.cn/simple';
    npmInstallEnvs.BOA_CONDA_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda';
  }
  if (client) {
    npmClient = client;
    if (!optionalNpmClients.includes(npmClient)) {
      spinner.fail(`Invalid npm client: ${npmClient}.`);
      return process.exit(1);
    }
  } else {
    const clientChoices = [];
    for (const npmClient of optionalNpmClients) {
      if (sync(npmClient)) {
        clientChoices.push(npmClient);
      }
    }

    if (clientChoices.length === 1) {
      npmClient = clientChoices[0];
    } else if (clientChoices.length > 1) {
      const answer = await prompt([
        {
          type: 'list',
          name: 'client',
          message: 'which client do you want to use?',
          choices: clientChoices
        }
      ]);
      npmClient = answer.client;
    } else {
      spinner.fail(`no npm client detected`);
      return process.exit(1);
    }
  }

  let dirname;
  try {
    dirname = path.join(os.homedir(), '.pipcook');
    fse.ensureDirSync(path.join(dirname, '.server'));
    fse.ensureDirSync(path.join(dirname, 'dependencies'));
    fse.copySync(path.join(__dirname, '..', 'assets', 'server'), path.join(dirname, '.server'));
 
    // init npm project
    childProcess.execSync(`${npmClient} init -y`, {
      cwd: path.join(dirname, 'dependencies'),
      stdio: 'inherit'
    });
    spinner.start(`installing pipcook`);

    for (const item of dependencies) {
      childProcess.execSync(`${npmClient} install ${item}${beta ? '@beta' : ''} --save`, {
        cwd: path.join(dirname, 'dependencies'),
        stdio: 'inherit',
        env: npmInstallEnvs
      });
    }
    spinner.succeed(`install pipcook core successfully`);
    spinner.start(`installing pipcook board`);
    childProcess.execSync(`${npmClient !== 'tnpm' ? npmClient : 'npm'} install`, {
      cwd: path.join(dirname, '.server'),
      stdio: 'inherit',
      env: npmInstallEnvs
    });
    spinner.succeed(`install pipcook board successfully`);
  } catch (err) {
    spinner.fail(`failed to initialize the project: ${err && err.stack}`);
    childProcess.execSync(`rm -r ${path.join(dirname, 'dependencies')}`);
    childProcess.execSync(`rm -r ${path.join(dirname, '.server')}`);
  }
};
