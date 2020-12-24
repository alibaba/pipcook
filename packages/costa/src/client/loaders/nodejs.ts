import { PluginPackage } from '../../index';

export default function (pkg: PluginPackage): (...args: any) => any {
  // get the plugin function.
  let fn = require(pkg.name);
  if (fn && typeof fn !== 'function' && typeof fn.default === 'function') {
    // compatible with ESM default export.
    fn = fn.default;
  }
  return fn;
}
