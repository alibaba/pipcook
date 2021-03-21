import { FrameworkModule } from '@pipcook/core';
/**
 * import from path
 * @param path the path where import from
 */
export const importFrom = (path: string): Promise<FrameworkModule> => {
  return import(path);
};
