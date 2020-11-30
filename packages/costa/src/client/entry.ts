import * as path from 'path';
import { UniDataset, DataLoader, generateId } from '@pipcook/pipcook-core';
import Debug from 'debug';

import { PluginProtocol, PluginOperator, PluginMessage } from '../protocol';
import { PluginPackage } from '../index';
import loadPlugin from './loaders';

type MessageHandler = Record<PluginOperator, (proto: PluginProtocol) => void>;
const debug = Debug('costa.client');

// Set the costa runtime title.
process.title = 'pipcook.costa';

function send(msg: any): void {
  // FIXME(yorkie): here we just print the error message.
  const onfailMsg = 'failed to send a message to parent process.';
  const success = process.send(msg, (err: Error) => {
    if (err) {
      console.error(onfailMsg, `The error is ${err}`);
    }
  });
  if (!success) {
    console.error(onfailMsg);
  }
}

/**
 * Send a `recv` message back from the client process.
 * @param respOp the operator of response.
 * @param params the parameters of response.
 */
function recv(respOp: PluginOperator, ...params: string[]): void {
  return send(PluginProtocol.stringify(respOp, {
    event: 'pong',
    params
  }));
}

/**
 * Send a `emit` message back from the client process, this will not stop the message handler.
 * @param respOp the operator of response.
 * @param msg
 */
function emit(respOp: PluginOperator, msg: string): void {
  return send(PluginProtocol.stringify(respOp, {
    event: 'emit',
    params: [ msg ]
  }));
}

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
 * Deserialize an argument.
 * @param arg
 */
function deserializeArg(arg: Record<string, any>): any {
  if (arg.__flag__ === '__pipcook_plugin_runnable_result__' &&
    previousResults[arg.id]) {
    return previousResults[arg.id];
  }
  return arg;
}

/**
 * Run a plugin, before running, a clean sandbox environment will be constructed
 * for the plug-in runtime.
 * @param message
 */
async function emitStart(message: PluginMessage): Promise<void> {
  const { params } = message;
  const pkg = params[0] as PluginPackage;
  const [ , ...pluginArgs ] = params;
  console.info(`start loading plugin ${pkg.name}`);

  try {
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

    const fn = loadPlugin(pkg);
    emit(PluginOperator.WRITE, 'plugin loaded');

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
      recv(PluginOperator.WRITE);
      return;
    }

    if (pkg.pipcook.category === 'datasetProcess') {
      const [ dataset, args ] = pluginArgs.map(deserializeArg) as [ UniDataset, any ];
      await fn(dataset, args);
      recv(PluginOperator.WRITE);
      return;
    }

    // default handler for plugins.
    const resp = await fn(...pluginArgs.map(deserializeArg));
    if (resp) {
      const rid = generateId();
      previousResults[rid] = resp;
      console.info(`create a result "${rid}" for plugin "${pkg.name}@${pkg.version}"`);
      recv(PluginOperator.WRITE, rid);
    } else {
      recv(PluginOperator.WRITE);
    }
  } catch (err) {
    recv(PluginOperator.WRITE, 'error', err?.stack);
  }
}

/**
 * Emits a destroy event, it exits the current client process.
 */
async function emitDestroy(): Promise<void> {
  clientId = null;
  handshaked = false;
  process.exit(0);
}

/**
 * Gets the response by a result.
 * @param message
 */
function getResponse(message: PluginMessage): void {
  const resp = deserializeArg(message.params[0]);
  recv(PluginOperator.READ, JSON.stringify(resp));
}

const handlers: MessageHandler = {
  /**
   * When each client process is just started, CostaRuntime will send a handshake
   * command, and the client will reply with a Pong message through START, which
   * is counted as a complete handshake. The client process will not receive other
   * messages until the handshake is complete.
   */
  [PluginOperator.START]: (proto: PluginProtocol): void => {
    if (proto.message.event === 'handshake' &&
      typeof proto.message.params[0] === 'string') {
      clientId = proto.message.params[0];
      handshaked = true;
      recv(PluginOperator.START, clientId);
    }
  },
  /**
   * The client process receives events from the runtime by processing the WRITE
   * message, such as executing the plug-in and ending the process.
   */
  [PluginOperator.WRITE]: async (proto: PluginProtocol): Promise<void> => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    const { event } = proto.message;
    debug(`receive an event write.${event}`);
    if (event === 'start') {
      emitStart(proto.message);
    } else if (event === 'destroy') {
      emitDestroy();
    }
  },
  /**
   * Use the READ command to read the value and status of some client processes.
   */
  [PluginOperator.READ]: async (proto: PluginProtocol): Promise<void> => {
    if (!handshaked) {
      throw new TypeError('handshake is required.');
    }
    const { event } = proto.message;
    debug(`receive an event read.${event}`);
    if (event === 'deserialize response') {
      getResponse(proto.message);
    }
  }
};

process.on('message', (msg): void => {
  const proto = PluginProtocol.parse(msg);
  handlers[proto.op](proto);
});

// if any error occurrs by promise chain in `nextTick`,
// the error will be thrown from event `unhandledRejection`,
// we need to handle and throw it out. Otherwise, this process will not exit.
// see #523 for details.
process.on('unhandledRejection', (reason) => {
  throw reason;
});
