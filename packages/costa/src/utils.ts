import { FrameworkModule } from '@pipcook/core';
import * as Module from 'module';

/**
 * import from path
 * @param path the path where import from
 */
export const importFrom = (path: string): Promise<FrameworkModule> => {
  return import(path);
};

export const requireFromString = (pkgName: string, scriptPath: string, modulePath: string) => {
  console.log('main', require.main);
  const m = new Module(pkgName, require.main);
  m.paths = [ modulePath ];
  return m.require(scriptPath);
}
