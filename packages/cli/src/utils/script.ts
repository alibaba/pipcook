import {
  PipelineMeta,
  ScriptConfig,
  ScriptType,
  PipcookScript
} from '@pipcook/costa';
import * as constants from '../constants';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parse } from 'url';
import { fetchWithCache } from './cache';
import * as queryString from 'query-string';
import { DownloadProtocol } from './';

export const downloadScript = async (scriptDir: string, scriptOrder: number, url: string, type: ScriptType, enableCache: boolean, devMode: boolean): Promise<PipcookScript> => {
  const urlObj = parse(url);
  const baseName = path.parse(urlObj.pathname).base;
  let localPath = path.join(scriptDir, `${scriptOrder}-${baseName}`);
  const query = queryString.parse(urlObj.query);
  // if the url is is file protocol, import it directly in development mode or copy it in normal mode.
  if (urlObj.protocol === DownloadProtocol.FILE || urlObj.protocol === null) {
    if (path.isAbsolute(urlObj.pathname)) {
      if (devMode) {
        localPath = urlObj.pathname;
      } else {
        await fs.copy(urlObj.pathname, localPath);
      }
    } else {
      if (devMode) {
        localPath = path.join(process.cwd(), urlObj.pathname);
      } else {
        await fs.copy(path.join(process.cwd(), urlObj.pathname), localPath);
      }
    }
  } else {
    if (urlObj.protocol === DownloadProtocol.HTTP || urlObj.protocol === DownloadProtocol.HTTPS) {
      // maybe should copy the script with COW
      await fetchWithCache(constants.PIPCOOK_SCRIPT_PATH, url, localPath, enableCache, true);
    } else {
      throw new TypeError(`unsupported protocol ${urlObj.protocol}`);
    }
  }
  return {
    name: baseName,
    path: localPath,
    type,
    query
  };
};

export const prepareScript = async (pipelineMeta: PipelineMeta, scriptDir: string, enableCache = true, devMode = false): Promise<ScriptConfig> => {
  const scripts: ScriptConfig = {
    datasource: null,
    dataflow: null,
    model: null
  };
  let scriptOrder = 0;
  scripts.datasource
    = await downloadScript(scriptDir, scriptOrder, pipelineMeta.datasource, ScriptType.DataSource, enableCache, devMode);
  scriptOrder++;
  if (Array.isArray(pipelineMeta.dataflow) && pipelineMeta.dataflow.length > 0) {
    scripts.dataflow = [];
    for (const dataflowUri of pipelineMeta.dataflow) {
      scripts.dataflow.push(await downloadScript(scriptDir, scriptOrder, dataflowUri, ScriptType.Dataflow, enableCache, devMode));
      scriptOrder++;
    }
  }
  scripts.model = await downloadScript(scriptDir, scriptOrder, pipelineMeta.model, ScriptType.Model, enableCache, devMode);
  return scripts;
};

export const linkCoreToScript = async (scriptModulePath: string): Promise<void> => {
  console.log('scriptModulePath', scriptModulePath);
  const coreTargetPath = path.join(scriptModulePath, '@pipcook/core');
  await fs.remove(coreTargetPath);
  console.log('removed', coreTargetPath);
  const coreScriptPath = require.resolve('@pipcook/core');
  const coreDir = path.join('/core');
  console.log('coreDir', coreDir);
  const coreSourcePath = coreScriptPath.substr(0, coreScriptPath.lastIndexOf(coreDir) + coreDir.length - 1);
  console.log('mkdirp', coreSourcePath, path.join(scriptModulePath, '@pipcook'));
  const pipcookModulePath = path.join(scriptModulePath, '@pipcook');
  console.log('xxxx', pipcookModulePath);
  await fs.mkdirp(pipcookModulePath);
  console.log('mkdirp done');
  await fs.symlink(coreSourcePath, coreTargetPath);
  console.log('symlink done', coreSourcePath, coreTargetPath);
};
