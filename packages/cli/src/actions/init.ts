import { join } from 'path';
import { execSync as exec } from 'child_process';
import { readJson, writeJson, ensureDir, symlink, remove, pathExists } from 'fs-extra';
import * as semver from 'semver';
import * as chalk from 'chalk';
import { prompt } from 'inquirer';
import { sync } from 'command-exists';
import { constants as CoreConstants, download } from '@pipcook/pipcook-core';

import { Constants, execAsync, logger } from '../utils/common';
import { InitCommandHandler } from '../types';
import { optionalNpmClients, daemonPackage } from '../config';
import { PIPCOOK_MINICONDA_LIB } from '../constants';

const {
  BOA_CONDA_INDEX,
  BOA_CONDA_MIRROR
} = Constants;

async function npmInstall(npmClient: string, name: string, cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  exec(`"${npmClient}" init -f`, { cwd, env, stdio: 'ignore' });
  const cmd = `"${npmClient}" install ${name} -E --production`;
  exec(cmd, { cwd, env, stdio: 'inherit' });
}

function ensureNodeVersion(minimalVersion: string) {
  const unsupportedNodeVersion = !semver.satisfies(process.version, `>=${minimalVersion}`);
  if (unsupportedNodeVersion) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} which is not supported.\n` +
          `Please update to Node ${minimalVersion} or higher for a better, fully supported experience.\n`
      )
    );
    process.exit(1);
  }
}

/**
 * init the plugin project with boa and core
 */
async function initPlugin(daemonDir: string, pluginDir: string) {
  await ensureDir(pluginDir);
  if (!await pathExists(join(pluginDir, 'package.json'))) {
    exec('npm init -y', { cwd: pluginDir, stdio: 'ignore' });
  }

  if (!await pathExists(daemonDir)) {
    return logger.warn('daemon is not installed.');
  }
  let boa = join(daemonDir, 'node_modules/@pipcook/boa');
  if (!await pathExists(boa)) {
    boa = join(daemonDir, 'node_modules/@pipcook/daemon/node_modules/@pipcook/costa/node_modules/@pipcook/boa');
    if (!await pathExists(boa)) {
      return logger.warn('boa is not installed.');
    }
  }
  let core = join(daemonDir, 'node_modules/@pipcook/pipcook-core');
  if (!await pathExists(core)) {
    core = join(daemonDir, 'node_modules/@pipcook/daemon/node_modules/@pipcook/pipcook-core');
    if (!await pathExists(core)) {
      return logger.warn('pipcook-core is not installed.');
    }
  }
  await ensureDir(join(pluginDir, 'node_modules/@pipcook'));
  const boaPlugin = join(pluginDir, 'node_modules/@pipcook/boa');
  const corePlugin = join(pluginDir, 'node_modules/@pipcook/core');
  let pluginPackage = await readJson(join(pluginDir, 'package.json'));
  if (!pluginPackage) {
    pluginPackage = {};
  }
  if (!pluginPackage.dependencies || typeof pluginPackage.dependencies !== 'object') {
    pluginPackage.dependencies = {};
  }
  if (!await pathExists(boaPlugin)) {
    await symlink(boa, boaPlugin);
    const boaPackage = await readJson(join(boaPlugin, 'package.json'));
    pluginPackage.dependencies[boaPackage.name] = boaPackage.version;
  }
  if (!await pathExists(corePlugin)) {
    await symlink(core, corePlugin);
    const corePackage = await readJson(join(corePlugin, 'package.json'));
    pluginPackage.dependencies[corePackage.name] = corePackage.version;
  }
  await writeJson(join(pluginDir, 'package.json'), pluginPackage, { spaces: 2 });
}

/**
 * install all dependencies of pipcook into working dir
 */
const init: InitCommandHandler = async (version: string, { beta, client, tuna }) => {
  ensureNodeVersion('12.19');

  let npmClient = 'npm';
  if (beta) {
    version = 'beta';
  }
  const npmInstallEnvs = Object.assign({}, process.env);
  if (tuna) {
    npmInstallEnvs.BOA_CONDA_INDEX = BOA_CONDA_INDEX;
    npmInstallEnvs.BOA_CONDA_MIRROR = BOA_CONDA_MIRROR;
    logger.info(`switch conda index: ${npmInstallEnvs.BOA_CONDA_INDEX}`);
    logger.info(`switch conda mirror: ${npmInstallEnvs.BOA_CONDA_MIRROR}`);
  }
  if (client) {
    npmClient = client;
    if (!optionalNpmClients.includes(npmClient)) {
      return logger.fail(`uknown npm client: ${npmClient}, available clients: ${optionalNpmClients.join(',')}.`);
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
      return logger.fail(`no npm client detected`);
    }
  }

  // Install the daemon.
  try {
    await remove(CoreConstants.PIPCOOK_DAEMON);
    await ensureDir(CoreConstants.PIPCOOK_DAEMON);
    if (tuna) {
      // write the daemon config
      await writeJson(join(CoreConstants.PIPCOOK_HOME_PATH, 'daemon.config.json'), {
        env: {
          BOA_CONDA_MIRROR
        }
      }, {
        spaces: 2
      });
    }
    let daemon = daemonPackage;
    if (version) {
      daemon += `@${version}`;
    }
    await npmInstall(npmClient, daemon, CoreConstants.PIPCOOK_DAEMON, npmInstallEnvs);
    await Promise.all([
      download('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/wasm/tvmjs_support.bc', join(PIPCOOK_MINICONDA_LIB, 'tvmjs_support.bc')),
      download('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/wasm/wasm_runtime.bc', join(PIPCOOK_MINICONDA_LIB, 'wasm_runtime.bc')),
      download('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/wasm/webgpu_runtime.bc', join(PIPCOOK_MINICONDA_LIB, 'webgpu_runtime.bc'))
    ]);
    await initPlugin(CoreConstants.PIPCOOK_DAEMON, CoreConstants.PIPCOOK_PLUGINS);
    logger.success('Pipcook is ready, you can try "pipcook --help" to get started.');
  } catch (err) {
    logger.fail(`failed to initialize Pipcook with the error ${err && err.stack}`, false);
    await remove(CoreConstants.PIPCOOK_DAEMON);
  }
};

export default init;
