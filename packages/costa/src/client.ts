import { PluginProto, PluginOperator } from './proto';
import { PluginPackage } from './index';
import Debug from 'debug';
const boa = require('@pipcook/boa');

type MessageHandler = Record<PluginOperator, (proto: PluginProto) => void>;
const debug = Debug('costa.client');

function recv(respOp: PluginOperator, ...params: string[]) {
  process.send(PluginProto.stringify(respOp, {
    event: 'pong',
    params
  }));
}

let clientId: string;

const handlers: MessageHandler = {
  [PluginOperator.START]: (proto: PluginProto) => {
    console.log(proto);
    if (proto.message.event === 'handshake' &&
      typeof proto.message.params[0] === 'string') {
      clientId = proto.message.params[0];
      recv(PluginOperator.START, clientId);
    }
  },
  [PluginOperator.WRITE]: async (proto: PluginProto) => {
    const { event, params } = proto.message;
    debug(`receive an event ${event}`);
    if (event === 'start') {
      const pkg = params[0] as PluginPackage;
      const [ , ...pluginArgs ] = params;
      debug(`start loading plugin ${pkg.name}`);

      try {
        if (pkg.pipcook?.target.PYTHONPATH) {
          boa.setenv(pkg.pipcook.target.PYTHONPATH);
          debug('setup boa environment');
        }
        let fn = require(pkg.name);
        if (fn && typeof fn !== 'function' && typeof fn.default === 'function') {
          fn = fn.default;
        }
        const resp = await fn(...pluginArgs);
        console.log(resp);
        recv(PluginOperator.WRITE);
      } catch (err) {
        console.error(`occurring an error: ${err?.stack}`);
      }
    } else if (event === 'destroy') {
      debug('stop the plugin.');
      process.exit(0);
    }
  },
  [PluginOperator.READ]: (proto: PluginProto) => {
    // TODO
  },
  [PluginOperator.COMPILE]: (proto: PluginProto) => {
    // TODO
  }
};

process.on('message', (msg) => {
  const proto = PluginProto.parse(msg) as PluginProto;
  handlers[proto.op](proto);
});
