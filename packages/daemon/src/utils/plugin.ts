import { CostaRuntime } from '@pipcook/costa';

let costaInstance: CostaRuntime;

export function createPluginRuntime(opts: any): CostaRuntime {
  if (costaInstance) {
    return costaInstance;
  }
  costaInstance = new CostaRuntime(opts);
  return costaInstance;
}

export function getPluginRuntime(): CostaRuntime {
  return costaInstance;
}
