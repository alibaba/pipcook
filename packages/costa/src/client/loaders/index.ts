import { PluginPackage } from '../../index';

// import all loaders
import loadAsNodeJs from './nodejs';
import loadAsPython from './python';

export default function(pkg: PluginPackage): Function {
  const { runtime } = pkg.pipcook;
  if (runtime === 'python') {
    return loadAsPython(pkg);
  }
  return loadAsNodeJs(pkg);
}
