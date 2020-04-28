#!/usr/bin/env ts-node
import semver from 'semver';
import chalk from 'chalk';

import { initCommander } from './commands';

export function run(): void {
  // check node version
  if (!semver.gte(process.version, '10.0.0')) {
    console.log(
      chalk.red(
        `Pipcook requires node version higher than node 10.x. Howeverm your kicak node version is ${process.version}, ` +
        'Please update node.js'
      )
    );
    return;
  }

  initCommander();
}
