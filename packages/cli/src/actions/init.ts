import path from 'path';
import { execSync as exec } from 'child_process';
import fse from 'fs-extra';
import ora from 'ora';
import { prompt } from 'inquirer';
import { sync } from 'command-exists';
import * as os from 'os';

import { InitCommandHandler } from '../types';
import { optionalNpmClients, daemonPackage, boardPackage } from '../config';

const spinner = ora();
const NPM_PUBLIC_REGISTRY = 'https://registry.npmjs.org/';

function npmInstall(npmClient: string, name: string, beta: boolean, cwd: string, env: NodeJS.ProcessEnv) {
  if (beta) {
    name += '@beta';
  }
  const command = `${npmClient} install ${name} --registry ${NPM_PUBLIC_REGISTRY}`;
  console.info(`exec ${command}`);
  return exec(command, { cwd, env, stdio: 'inherit' });
}

/**
 * install all dependencies of pipcook into working dir
 */
const init: InitCommandHandler = async ({ client, beta, tuna }) => {
  let npmClient = 'npm';
  const npmInstallEnvs = Object.assign({}, process.env);
  if (tuna) {
    npmInstallEnvs.BOA_CONDA_INDEX = 'https://pypi.tuna.tsinghua.edu.cn/simple';
    npmInstallEnvs.BOA_CONDA_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda';
  }
  if (client) {
    npmClient = client;
    if (!optionalNpmClients.includes(npmClient)) {
      spinner.fail(`invalid npm client: ${npmClient}.`);
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

  // Install the daemon and pipboard.
  // use ~/.pipcook as PIPCOOK_DIR
  const PIPCOOK_DIR = path.join(os.homedir(), '.pipcook');
  const DAEMON_DIR = path.join(PIPCOOK_DIR, 'server');
  const BOARD_DIR = path.join(PIPCOOK_DIR, 'pipboard');

  try {
    await fse.ensureDir(DAEMON_DIR);
    await fse.ensureDir(BOARD_DIR);
    npmInstall(npmClient, daemonPackage, beta, DAEMON_DIR, npmInstallEnvs);
    npmInstall(npmClient, boardPackage, beta, BOARD_DIR, npmInstallEnvs);
    spinner.succeed('daemon and board installed.');
  } catch (err) {
    spinner.fail(`failed to initialize the project: ${err && err.stack}`);
    await fse.remove(DAEMON_DIR);
    await fse.remove(BOARD_DIR);
  }
};

export default init;
