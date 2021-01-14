import { PluginPackage } from '../../index';
const boa = require('@pipcook/boa');
const sys = boa.import('sys');

export default function (pkg: PluginPackage): (...args: any) => any {
  const fn = boa.import(`node_modules.${pkg.name.replace(/\//g, '.')}`);
  return (...args: any[]) => {
    const res = fn.main(...args);

    // flush all outputs(stdout/stderr).
    const { stdout, stderr } = sys;
    stdout.flush();
    stderr.flush();
    return res;
  };
}
