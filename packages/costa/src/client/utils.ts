export const dependenciesCache: Record<string, any> = {};

/**
 * the package name list which need to be redirect.
 */
export const redirectList = [ '@tensorflow/tfjs-node-gpu' ];
/**
 * if the dependency has been cached, use the cached version,
 * if not, require and cache it.
 * @param dependencyName dependency package name
 * @param paths paths for searching
 */
export const redirectDependency = (dependencyName: string, paths: string[]): void => {
  const moduleName = require.resolve(dependencyName, { paths });
  if (dependenciesCache[dependencyName]) {
    // assign the `require.cache` from cached tfjs object.
    require.cache[moduleName] = dependenciesCache[dependencyName];
  } else {
    // prepare load tfjs module.
    require(moduleName);
    // set tfjsCache from `require.cache`.
    dependenciesCache[dependencyName] = require.cache[moduleName];
  }
};
