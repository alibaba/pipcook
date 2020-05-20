#!/usr/bin/env node

import program from 'commander';

program
  .command('install <name>')
  .action(function (dir, cmdObj) {
    console.log('remove ' + dir + (cmdObj.recursive ? ' recursively' : ''))
  });

program.parse(process.argv);
