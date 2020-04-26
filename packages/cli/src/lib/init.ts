import path from 'path';
import childProcess from 'child_process';

import fse from 'fs-extra';
import ora from 'ora';
import glob from 'glob-promise';
import { prompt } from 'inquirer';
import { sync } from 'command-exists'

import { CMDHandler } from '../types';
import { dependencies, pipcookLogName, optionalNpmClients } from './config';

const spinner = ora();

export const init: CMDHandler = async function (cmdObj: string[]) {
  let client = 'npm';
  if (cmdObj && cmdObj[0]) {
    client = cmdObj[0];
    if (!optionalNpmClients.includes(client)) {
      spinner.fail(`Invalid npm client: ${client}.`);
      return;
    }
  } else {
    const clientChoices = [];
    for (const npmClient of optionalNpmClients) {
      if (sync(npmClient)) {
        clientChoices.push(npmClient);
      }
    }

    if (clientChoices.length === 1) {
      client = clientChoices[0];
    } else if (clientChoices.length > 1) {
      const answer = await prompt([
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

  const beta = cmdObj && cmdObj[0] === 'true';

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
      childProcess.execSync(`${client} install ${item}${beta ? '@beta' : ''} --save`, {
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
}
