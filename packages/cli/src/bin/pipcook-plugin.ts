#!/usr/bin/env node

import * as program from 'commander';
import { install, uninstall, list, info, create } from '../service/plugin';

program
  .command('install <name>')
  .helpOption('--help', 'show help')
  .description('install the given plugin name, plugin directory path, plugin tarball, git uri or tarball url.')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action((name: string, opts: any) => {
    install(name, opts);
  });

program
  .command('uninstall <name>')
  .helpOption('--help', 'show help')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .description('uninstall the given plugin')
  .action(uninstall);

program
  .command('list')
  .helpOption('--help', 'show help')
  .description('list installed plugin')
  .option('-c|--category <name>', 'the plugin category')
  .option('-d|--datatype <datatype>', 'the plugin datatype')
  .option('-n|--name <name>', 'the plugin package name')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list);

program
  .command('info <id>')
  .helpOption('--help', 'show help')
  .description('show plugin info by id')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(info);

program
  .command('create <plugin-directory>')
  .description('create a new plugin')
  .allowUnknownOption()
  .action(create);

program.parse(process.argv);
