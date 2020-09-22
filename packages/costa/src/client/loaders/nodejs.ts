import { PluginPackage } from '../../index';
import { getPluginDirectory } from '../../utils';

export default function (pkg: PluginPackage): Function {
  // get the plugin function.
  let requireName = getPluginDirectory(pkg.name, pkg.version, pkg.pipcook.source.from);
  let fn = require(requireName);
  if (fn && typeof fn !== 'function' && typeof fn.default === 'function') {
    // compatible with ESM default export.
    fn = fn.default;
  }
  return fn;
}
