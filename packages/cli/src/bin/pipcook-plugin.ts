#!/usr/bin/env node

import program from 'commander';
import { install, uninstall, list } from '../service/plugin';

program
  .command('install <name>')
  .description('install the given plugin.')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action((name: string, opts: any) => {
    install(name, opts);
  });

program
  .command('uninstall <name>')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .description('uninstall the given plugin')
  .action(uninstall);

program
  .command('list')
  .description('list installed plugin')
  .option('-c|--category <name>', 'the plugin category')
  .option('-d|--datatype <name>', 'the plugin datatype')
  .option('-n|--name <name>', 'the plugin package name')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list);

program.parse(process.argv);
