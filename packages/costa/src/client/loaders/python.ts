import { PluginPackage } from '../../index';
const boa = require('@pipcook/boa');

export default function (pkg: PluginPackage): Function {
  const fn = boa.import(pkg.name);
  return fn as Function;
}
