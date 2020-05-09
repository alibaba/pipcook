import { PluginOperator, PluginProto } from './proto';

describe('test the plugin operator classes', () => {
  it('should read the correct number from PluginOperator', () => {
    expect(PluginOperator.START).toEqual(0x30);
    expect(PluginOperator.WRITE).toEqual(0x31);
    expect(PluginOperator.READ).toEqual(0x32);
  });
});

describe('test the plugin proto', () => {
  it('should test the stringify and parse', () => {
    const proto: PluginProto = {
      op: PluginOperator.READ,
      message: {
        event: 'test',
        params: []
      }
    };
    expect(proto.op).toBe(PluginOperator.READ);
    expect(proto.message.event).toBe('test');

    const str = PluginProto.stringify(PluginOperator.START, { event: 'foobar' });
    const jproto = JSON.parse(str);
    expect(jproto.op).toBe(PluginOperator.START);
    expect(jproto.message.event).toBe('foobar');
  });
});
