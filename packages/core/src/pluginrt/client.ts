import { PluginProto, PluginOperator } from './proto';
import Debug from 'debug';

type MessageHandler = Record<PluginOperator, (proto: PluginProto) => void>;
const debug = Debug('core.pluginrt.client');

function pong() {
  process.send(PluginProto.stringify(PluginOperator.WRITE, {
    event: 'pong',
    params: []
  }));
}

const handlers: MessageHandler = {
  [PluginOperator.START]: (proto: PluginProto) => {
    pong();
  },
  [PluginOperator.WRITE]: async (proto: PluginProto) => {
    const { event, params } = proto.message;
    debug(`receive an event ${event}`);
    if (event === 'load') {
      debug(`start loading plugin ${params[0]}`);
      const plugin = require(params[0]).default;
      await plugin.call(null, params[1]);
      pong();
    } else if (event === 'destroy') {
      debug('stop the plugin...');
      process.exit();
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
