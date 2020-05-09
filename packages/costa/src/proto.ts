export interface PluginMessage {
  event: string;
  params?: any[];
}

export interface PluginResponse {
  id: string;
  __flag__: string;
}

export enum PluginOperator {
  START = 0x30,
  WRITE = 0x31,
  READ = 0x32,
  COMPILE = 0x100
}

export class PluginProto {
  op: PluginOperator;
  message: PluginMessage;

  static stringify(op: PluginOperator, message: PluginMessage): string {
    return JSON.stringify({ op, message });
  }
  static parse(str: string): PluginProto {
    return JSON.parse(str) as PluginProto;
  }
}
