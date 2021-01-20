import * as path from 'path';
import { UniDataset, DataLoader, generateId } from '@pipcook/pipcook-core';
import Debug from 'debug';

import { IPCInput } from '../protocol';
import { PluginPackage } from '../index';
import loadPlugin from './loaders';

const debug = Debug('costa.client');

const previousFlag = '__pipcook_plugin_runnable_result__';

// Set the costa runtime title.
process.title = 'pipcook.costa';

let tfjsCache: any;

/**
 * The id of client.
 */
let clientId: string;

/**
 * The flag to be handshaked.
 */
let handshaked = false;

/**
 * In a client, multiple plugins can be executed. To avoid the overhead of serialization,
 * we save the results of each plugin for peer `CostaRuntime`.
 */
let previousResults: Record<string, any> = {};

/**
 * The `Record` of loaded plugins, the key is a string of pname@pversion.
 */
const plugins: Record<string, (...args : any) => any> = {};

/**
 * Deserialize an argument.
 * @param arg
 */
function deserializeArg(arg: Record<string, any>): any {
  if (arg.__flag__ === previousFlag &&
    previousResults[arg.id]) {
    return previousResults[arg.id];
  }
  return arg;
}

/**
 * load a plugin.
 * @param message
 */
async function load(pkg: PluginPackage): Promise<void> {
  console.info(`start loading plugin ${pkg.name}`);
  const boa = require('@pipcook/boa');
  if (pkg.pipcook?.target.PYTHONPATH) {
    boa.setenv(pkg.pipcook.target.PYTHONPATH);
    debug(`setup boa environment for ${pkg.pipcook.target.PYTHONPATH}`);
  }

  // FIXME(Yorkie): handle tfjs initialization issue.
  if (pkg.dependencies['@tensorflow/tfjs-node-gpu']) {
    // resolve the `@tensorflow/tfjs-node-gpu` by the current plugin package.
    const tfjsModuleName = require.resolve('@tensorflow/tfjs-node-gpu', {
      paths: [ path.join(process.cwd(), 'node_modules', pkg.name) ]
    });
    if (tfjsCache) {
      // assign the `require.cache` from cached tfjs object.
      require.cache[tfjsModuleName] = tfjsCache;
    } else {
      // prepare load tfjs module.
      require(tfjsModuleName);
      // set tfjsCache from `require.cache`.
      tfjsCache = require.cache[tfjsModuleName];
    }
  }

  const absname = `${pkg.name}@${pkg.version}`;
  plugins[absname] = loadPlugin(pkg);
  console.info(`${pkg.name} plugin is loaded`);
}

/**
 * Run a plugin, before running, a clean sandbox environment will be constructed
 * for the plug-in runtime.
 * @param message
 */
async function start(pkg: PluginPackage, pluginArgs: any): Promise<Record<string, any> | undefined> {
  const absname = `${pkg.name}@${pkg.version}`;
  const fn = plugins[absname];
  if (typeof fn !== 'function') {
    throw new TypeError(`the plugin(${absname}) not loaded.`);
  }

  if (pkg.pipcook.category === 'dataProcess') {
    // in "dataProcess" plugin, we need to do process them in one by one.
    const [ dataset, args ] = pluginArgs.map(deserializeArg) as [ UniDataset, any ];
    [ dataset.trainLoader, dataset.validationLoader, dataset.testLoader ]
      .filter((loader: DataLoader) => loader != null)
      .forEach(async (loader: DataLoader) => {
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
    const [ dataset, args ] = pluginArgs.map(deserializeArg) as [ UniDataset, any ];
    await fn(dataset, args);
    return;
  }

  // default handler for plugins.
  const resp = await fn(...pluginArgs.map(deserializeArg));
  if (resp) {
    const id = generateId();
    previousResults[id] = resp;
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
async function destroy(): Promise<void> {
  process.nextTick(() => {
    clientId = null;
    handshaked = false;
    process.exit(0);
  });
}

const handlers: Record<string, any> = {
  'handshake': (id: string): string => {
    handshaked = true;
    clientId = id;
    return clientId;
  },
  'load': async (pkg: PluginPackage): Promise<void> => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    return load(pkg);
  },
  'start': async (pkg: PluginPackage, ...pluginArgs: any): Promise<Record<string, any> | undefined> => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    return start(pkg, pluginArgs);
  },
  'destroy': async (): Promise<void> => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    return destroy();
  },
  'valueOf': (obj: Record<string, any>): any => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    return deserializeArg(obj);
  }
};

function send(message: Record<string, any>) {
  if (!process.send(message, (err: Error) => {
    if (err) {
      console.error(`failed to send a message to parent process with error: ${err.message}`);
    }
  })) {
    console.error('failed to send a message to parent process.');
  }
}

process.on('message', async (msg: IPCInput): Promise<void> => {
  debug('entry receive message', msg, handlers);
  if (
    msg
    && typeof msg === 'object'
    && typeof msg.method === 'string'
    && typeof msg.id === 'number'
  ) {
    if (!(msg.method in handlers)) {
      send({ id: msg.id, error: new TypeError(`no method found: ${msg.method}`), result: null });
      return;
    }
    try {
      const args = msg.args || [];
      const rst = handlers[msg.method](...args);
      let returnValue = rst;
      if (rst instanceof Promise) {
        returnValue = await rst;
      }
      send({ id: msg.id, error: null, result: returnValue });
    } catch (err) {
      send({ id: msg.id, error: { messsage: err.message, stack: err.stack }, result: null });
    }
  }
});

// if any error occurrs by promise chain in `nextTick`,
// the error will be thrown from event `unhandledRejection`,
// we need to handle and throw it out. Otherwise, this process will not exit.
// see #523 for details.
process.on('unhandledRejection', (reason) => {
  throw reason;
});
