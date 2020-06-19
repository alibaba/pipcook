import { join, dirname } from 'path';
import { execSync as exec } from 'child_process';
import fse, { symlink, readJson, ensureDir } from 'fs-extra';
import { prompt } from 'inquirer';
import { sync } from 'command-exists';
import * as os from 'os';
import { ora, Constants } from '../utils';

import { InitCommandHandler } from '../types';
import { isLocal, optionalNpmClients, daemonPackage, boardPackage } from '../config';

const {
  BOA_CONDA_INDEX,
  BOA_CONDA_MIRROR
} = Constants;

async function npmInstall(npmClient: string, name: string, beta: boolean, cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  if (isLocal) {
    const pkg = await readJson(name + '/package.json');
    const dest = join(cwd, 'node_modules', pkg.name);
    await ensureDir(dirname(dest));
    await symlink(name, dest, 'dir');
  } else {
    if (beta) {
      name = `${name}@beta`;
    }
    const cmd = `${npmClient} install ${name} --force`;
    console.info(`exec <${cmd}>`);
    exec(cmd, { cwd, env, stdio: 'inherit' });
  }
}

/**
 * install all dependencies of pipcook into working dir
 */
const init: InitCommandHandler = async ({ client, beta, tuna }) => {
  const spinner = ora();
  let npmClient = 'npm';
  const npmInstallEnvs = Object.assign({}, process.env);
  if (tuna) {
    npmInstallEnvs.BOA_CONDA_INDEX = BOA_CONDA_INDEX;
    npmInstallEnvs.BOA_CONDA_MIRROR = BOA_CONDA_MIRROR;
    spinner.info(`switch conda index: ${npmInstallEnvs.BOA_CONDA_INDEX}`);
    spinner.info(`switch conda mirror: ${npmInstallEnvs.BOA_CONDA_MIRROR}`);
  }
  if (client) {
    npmClient = client;
    if (!optionalNpmClients.includes(npmClient)) {
      spinner.fail(`uknown npm client: ${npmClient}, available clients: ${optionalNpmClients.join(',')}.`);
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
  const PIPCOOK_DIR = join(os.homedir(), '.pipcook');
  const DAEMON_DIR = join(PIPCOOK_DIR, 'server');
  const BOARD_DIR = join(PIPCOOK_DIR, 'pipboard');
  const BOARD_BUILD = join(BOARD_DIR, 'node_modules', '@pipcook', 'pipboard', 'build');
  const DAEMON_PUBLIC = join(DAEMON_DIR, 'node_modules', '@pipcook', 'daemon', 'src', 'app', 'public');

  try {
    await fse.remove(DAEMON_DIR);
    await fse.remove(BOARD_DIR);

    await fse.ensureDir(DAEMON_DIR);
    await fse.ensureDir(BOARD_DIR);
    if (tuna) {
      // write the daemon config
      await fse.writeJSON(join(PIPCOOK_DIR, 'daemon.config.json'), {
        env: {
          BOA_CONDA_MIRROR
        }
      });
    }

    await Promise.all([
      npmInstall(npmClient, daemonPackage, beta, DAEMON_DIR, npmInstallEnvs),
      npmInstall(npmClient, boardPackage, beta, BOARD_DIR, npmInstallEnvs)
    ]);
    await fse.copy(BOARD_BUILD, DAEMON_PUBLIC);
    spinner.succeed('Pipcook is ready, you can try "pipcook --help" to get started.');
  } catch (err) {
    spinner.fail(`failed to initialize Pipcook with the error ${err && err.stack}`);
    await fse.remove(DAEMON_DIR);
    await fse.remove(BOARD_DIR);
  }
};

export default init;
