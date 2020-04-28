import { PluginProto, PluginOperator } from './proto';

process.on('message', (msg) => {
  const proto = PluginProto.parse(msg) as PluginProto;
  if (proto.op === PluginOperator.START) {
    process.send(PluginProto.stringify(PluginOperator.START, {
      event: 'success',
      params: []
    }));
  } else if (proto.op === PluginOperator.WRITE) {
    const factoryMethod = require(proto.message.params[0]).default;
    console.log(factoryMethod);
  }
});
