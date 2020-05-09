/**
 * It represents exchange message between CostaRuntime and runnable client.
 */
export interface PluginMessage {
  event: string;
  params?: any[];
}

/**
 * It represents a plugin returned value.
 */
export interface PluginResponse {
  id: string;
  __flag__: string;
}

/**
 * It represents the plugin operators.
 */
export enum PluginOperator {
  START = 0x30,
  WRITE = 0x31,
  READ = 0x32
}

/**
 * Plugin Exchange Protocol.
 */
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
