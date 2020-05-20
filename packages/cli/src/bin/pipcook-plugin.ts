#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { install, uninstall } from '../service/plugin';

program
  .command('install <name>')
  .description('install the given plugin.')
  .action((name: string) => {
    if (name[0] === '.') {
      name = path.join(process.cwd(), name);
    }
    install(name);
  });

program
  .command('uninstall <name>')
  .description('uninstall the given plugin')
  .action(uninstall);

program.parse(process.argv);
