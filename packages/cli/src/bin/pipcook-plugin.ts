#!/usr/bin/env node

import program from 'commander';
import { install, uninstall } from '../service/plugin';

program
  .command('install <name>')
  .description('install the given plugin.')
  .action(install);

program
  .command('uninstall <name>')
  .description('uninstall the given plugin')
  .action(uninstall);

program.parse(process.argv);
