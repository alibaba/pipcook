import { join, dirname } from 'path';
import { execSync as exec } from 'child_process';
import fse, { readJson, ensureDir, symlink } from 'fs-extra';
import { prompt } from 'inquirer';
import { sync } from 'command-exists';
import { constants as CoreConstants } from '@pipcook/pipcook-core';

import { ora, Constants } from '../utils';
import { InitCommandHandler } from '../types';
import { optionalNpmClients, daemonPackage, boardPackage, isLocal } from '../config';

const {
  BOA_CONDA_INDEX,
  BOA_CONDA_MIRROR
} = Constants;

async function npmInstall(npmClient: string, name: string, beta: boolean, cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  exec(`"${npmClient}" init -f`, { cwd, env, stdio: 'ignore' });
  if (isLocal) {
    // FIXME(yorkie): manually make symlink to local development
    // This is because npm-install from path will not be compatible with lerna's node_modules/.staging dir.
    const pkg = await readJson(name + '/package.json');
    const dest = join(cwd, 'node_modules', pkg.name);
    await ensureDir(dirname(dest));
    await symlink(name, dest, 'dir');
  } else {
    if (beta) {
      name = `${name}@beta`;
    }
    const cmd = `"${npmClient}" install ${name} -E --production`;
    console.info(`exec "${cmd}"`);
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
  try {
    await fse.remove(CoreConstants.PIPCOOK_DAEMON);
    await fse.remove(CoreConstants.PIPCOOK_BOARD);

    await fse.ensureDir(CoreConstants.PIPCOOK_DAEMON);
    await fse.ensureDir(CoreConstants.PIPCOOK_BOARD);
    if (tuna) {
      // write the daemon config
      await fse.writeJSON(join(CoreConstants.PIPCOOK_HOME_PATH, 'daemon.config.json'), {
        env: {
          BOA_CONDA_MIRROR
        }
      });
    }

    await Promise.all([
      npmInstall(npmClient, daemonPackage, beta, CoreConstants.PIPCOOK_DAEMON, npmInstallEnvs),
      npmInstall(npmClient, boardPackage, beta, CoreConstants.PIPCOOK_BOARD, npmInstallEnvs)
    ]);
    await fse.copy(CoreConstants.PIPCOOK_BOARD_BUILD, CoreConstants.PIPCOOK_DAEMON_PUBLIC);
    spinner.succeed('Pipcook is ready, you can try "pipcook --help" to get started.');
  } catch (err) {
    spinner.fail(`failed to initialize Pipcook with the error ${err && err.stack}`);
    await fse.remove(CoreConstants.PIPCOOK_DAEMON);
    await fse.remove(CoreConstants.PIPCOOK_BOARD);
  }
};

export default init;
