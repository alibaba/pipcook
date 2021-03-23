import * as fs from 'fs-extra';
import * as path from 'path';
import {
  PipelineMeta,
  ArtifactExports,
  ArtifactMeta,
  constants
} from '@pipcook/core';
import { execAsync } from './';

export interface PluginVersion {
  name: string,
  version: string
}

/**
 * extract the verison in the name expression, return empty string if no version found
 * @param name package name with semver
 */
export const extractVersion = (name: string): PluginVersion => {
  let n = name.length;
  while (n-- > 0) {
    if (name[n] === '/') {
      break;
    } else if (name[n] === '@') {
      return {
        name: name.substr(0, n),
        version: name.substr(n + 1)
      };
    }
  }
  return { name, version: 'latest' };
};

/**
 * install plugin
 * @param name package name: pipcook-ali-oss-uploader or pipcook-ali-oss-uploader@0.0.1
 * @param pluginHomeDir plugin home directory
 */
export const install = async (name: string, pluginHomeDir: string): Promise<string> => {
  if (!await fs.pathExists(pluginHomeDir)) {
    await fs.mkdirp(pluginHomeDir);
  }
  const pluginVersion = extractVersion(name);
  const alias = `${pluginVersion.name}-${pluginVersion.version}`;
  const requirePath = path.join(pluginHomeDir, 'node_modules', alias);
  // always update plugin if version is 'beta', 'alpha' or 'latest'
  if ([ 'beta', 'alpha', 'latest' ].includes(pluginVersion.version) || !(await fs.pathExists(requirePath))) {
    await execAsync(
      `npm install ${alias}@npm:${name} -P`,
      { cwd: pluginHomeDir }
    );
  }
  return requirePath;
};

export const prepareArtifactPlugin = async (pipelineMeta: PipelineMeta): Promise<Array<ArtifactMeta>> => {
  if (!pipelineMeta.artifacts) {
    return;
  }
  const allPlugins: Array<ArtifactMeta> = [];
  for (const plugin of pipelineMeta.artifacts) {
    const requirePath = await install(plugin.processor, constants.PIPCOOK_PLUGIN_ARTIFACT_PATH);
    let pluginExport: ArtifactExports = await import(requirePath);
    if (
      typeof pluginExport.initialize !== 'function'
      || typeof pluginExport.build !== 'function'
    ) {
      if (
        (pluginExport as any).default
        && typeof (pluginExport as any).default.initialize === 'function'
        && typeof (pluginExport as any).default.build === 'function'
      ) {
        pluginExport = (pluginExport as any).default;
      } else {
        throw new TypeError(`${plugin} is not a valid artifact plugin`);
      }
    }
    await pluginExport.initialize(plugin);
    allPlugins.push({
      artifactExports: pluginExport,
      options: plugin
    });
  }
  return allPlugins;
};
