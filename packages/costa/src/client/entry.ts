import * as path from 'path';
import { UniDataset, DataLoader, generateId } from '@pipcook/pipcook-core';
import Debug from 'debug';

import { IPCInput, IPCOutput } from '../protocol';
import { PluginPackage } from '../index';
import loadPlugin from './loaders';
import { redirectDependency, redirectList } from './utils';

const debug = Debug('costa.client');

export const previousFlag = '__pipcook_plugin_runnable_result__';

// Set the costa runtime title.
process.title = 'pipcook.costa';

export const ipcMethods = [ 'handshake', 'load', 'start', 'destroy', 'valueOf' ];

export class Entry {
  /**
   * The id of client.
   */
  clientId: string;

  /**
   * The flag to be handshaked.
   */
  handshaked = false;

  /**
   * In a client, multiple plugins can be executed. To avoid the overhead of serialization,
   * we save the results of each plugin for peer `CostaRuntime`.
   */
  previousResults: Record<string, any> = {};

  /**
   * The `Record` of loaded plugins, the key is a string of pname@pversion.
   */
  plugins: Record<string, (...args : any) => any> = {};

  /**
   * Processor
   */
  process: NodeJS.Process;

  constructor(process: NodeJS.Process) {
    this.process = process;
  }
  /**
   * Setup the communication between child and parent processes.
   */
  setup(): void {
    this.process.on('message', this.onMessage.bind(this));

    // if any error occurrs by promise chain in `nextTick`,
    // the error will be thrown from event `unhandledRejection`,
    // we need to handle and throw it out. Otherwise, this process will not exit.
    // see #523 for details.
    this.process.on('unhandledRejection', this.onUnhandledRejection.bind(this));
  }

  /**
   * handle rejection
   * @param err error from promise
   */
  onUnhandledRejection(err: Error): void {
    throw err;
  }
  /**
   * process ipc request from parent
   * @param msg msg from parent
   */
  async onMessage(msg: IPCInput): Promise<void> {
    debug('entry receive message', msg);
    if (
      msg
      && typeof msg === 'object'
      && typeof msg.method === 'string'
      && typeof msg.id === 'number'
    ) {
      if (!(ipcMethods.indexOf(msg.method) >= 0 ) || !(msg.method in this)) {
        const { message, stack } = new TypeError(`no method found: ${msg.method}`);
        this.send({ id: msg.id, error: { message, stack }, result: null });
        return;
      }
      try {
        if (msg.method !== 'handshake' && !this.handshaked) {
          throw new TypeError('handshake is required.');
        }
        const args = msg.args || [];
        const rst = (this as any)[msg.method](...args);
        let returnValue = rst;
        if (rst instanceof Promise) {
          returnValue = await rst;
        }
        this.send({ id: msg.id, error: null, result: returnValue });
      } catch (err) {
        this.send({ id: msg.id, error: { message: err.message, stack: err.stack }, result: null });
      }
    }
  }

  /**
   * Send response to parent process.
   * @param message response data
   */
  send(message: IPCOutput): void {
    if (!this.process.send(message, (err: Error) => {
      if (err) {
        console.error(`failed to send a message to parent process with error: ${err.message}`);
      }
    })) {
      console.error('failed to send a message to parent process.');
    }
  }

  /**
   * Deserialize an argument.
   * @param arg
   */
  valueOf(arg: Record<string, any>): any {
    if (arg.__flag__ === previousFlag &&
      this.previousResults[arg.id]) {
      return this.previousResults[arg.id];
    }
    return arg;
  }

  /**
   * Handshake to parent process.
   * @param id clinet from parent process
   */
  handshake(id: string): string {
    this.handshaked = true;
    this.clientId = id;
    return this.clientId;
  }

  /**
   * load a plugin.
   * @param pkg plugin package info
   */
  async load(pkg: PluginPackage): Promise<void> {
    console.info(`start loading plugin ${pkg.name}`);
    const boa = require('@pipcook/boa');
    if (pkg.pipcook?.target.PYTHONPATH) {
      boa.setenv(pkg.pipcook.target.PYTHONPATH);
      debug(`setup boa environment for ${pkg.pipcook.target.PYTHONPATH}`);
    }
    // FIXME(Yorkie): handle tfjs initialization issue.
    if (pkg.dependencies) {
      const paths = [ path.join(process.cwd(), 'node_modules', pkg.name) ];
      redirectList.forEach((pkgName) => {
        if (pkg.dependencies[pkgName]) {
          redirectDependency(pkgName, paths);
        }
      });
    }
    const absname = `${pkg.name}@${pkg.version}`;
    this.plugins[absname] = loadPlugin(pkg);
    console.info(`${pkg.name} plugin is loaded`);
  }

  /**
   * Run a plugin, before running, a clean sandbox environment will be constructed
   * for the plug-in runtime.
   * @param message
   */
  async start(pkg: PluginPackage, ...pluginArgs: any[] | undefined): Promise<Record<string, any> | undefined> {
    const absname = `${pkg.name}@${pkg.version}`;
    const fn = this.plugins[absname];
    if (typeof fn !== 'function') {
      throw new TypeError(`the plugin(${absname}) not loaded.`);
    }

    if (pkg.pipcook.category === 'dataProcess') {
      // in "dataProcess" plugin, we need to do process them in one by one.
      const [ dataset, args ] = pluginArgs.map(this.valueOf.bind(this)) as [ UniDataset, any ];
      [ dataset.trainLoader, dataset.validationLoader, dataset.testLoader ]
        .filter((loader: DataLoader) => loader != null)
        .forEach((loader: DataLoader) => {
          process.nextTick(async () => {
            const len = await loader.len();
            loader.processIndex = 0;
            for (let i = 0; i < len; i++) {
              let sample = await loader.getItem(i);
              sample = await fn(sample, dataset.metadata, args);
              await loader.setItem(i, sample);
              loader.processIndex = i + 1;
              loader.notifyProcess();
            }
          });
        });
      return;
    }

    if (pkg.pipcook.category === 'datasetProcess') {
      const [ dataset, args ] = pluginArgs.map(this.valueOf.bind(this)) as [ UniDataset, any ];
      await fn(dataset, args);
      return;
    }

    // default handler for plugins.
    const resp = await fn(...pluginArgs.map(this.valueOf.bind(this)));
    if (resp) {
      const id = generateId();
      this.previousResults[id] = resp;
      console.info(`create a result "${id}" for plugin "${pkg.name}@${pkg.version}"`);
      return {
        id,
        __flag__: previousFlag
      };
    }
  }

  /**
   * Emits a destroy event, it exits the current client process.
   */
  async destroy(): Promise<void> {
    process.nextTick(() => {
      this.clientId = null;
      this.handshaked = false;
      this.process.exit(0);
    });
  }
}

const entry = new Entry(process);
entry.setup();
