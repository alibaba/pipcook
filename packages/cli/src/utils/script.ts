import {
  PipelineMeta,
  ScriptConfig,
  ScriptType,
  PipcookScript
} from '@pipcook/costa';
import * as constants from '../constants';
import * as path from 'path';
import { parse } from 'url';
import { fetchWithCache } from './cache';
import * as queryString from 'query-string';
import { DownloadProtocol } from './';

export const downloadScript = async (scriptDir: string, scriptOrder: number, url: string, type: ScriptType, enableCache: boolean): Promise<PipcookScript> => {
  const urlObj = parse(url);
  const baseName = path.parse(urlObj.pathname).base;
  let localPath = path.join(scriptDir, `${scriptOrder}-${baseName}`);
  const query = queryString.parse(urlObj.query);
  // if the url is is file protocol, import it directly.
  if (urlObj.protocol === DownloadProtocol.FILE) {
    if (path.isAbsolute(urlObj.pathname)) {
      localPath = urlObj.pathname;
    } else {
      localPath = path.join(process.cwd(), urlObj.pathname);
    }
  } else {
    if (urlObj.protocol === DownloadProtocol.HTTP || urlObj.protocol === DownloadProtocol.HTTPS) {
      // maybe should copy the script with COW
      await fetchWithCache(constants.PIPCOOK_SCRIPT_PATH, url, localPath, enableCache);
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

export const prepareScript = async (pipelineMeta: PipelineMeta, scriptDir: string, enableCache = true): Promise<ScriptConfig> => {
  const scripts: ScriptConfig = {
    dataSource: null,
    dataflow: null,
    model: null
  };
  let scriptOrder = 0;
  scripts.dataSource
    = await downloadScript(scriptDir, scriptOrder, pipelineMeta.dataSource, ScriptType.DataSource, enableCache);
  scriptOrder++;
  if (Array.isArray(pipelineMeta.dataflow) && pipelineMeta.dataflow.length > 0) {
    scripts.dataflow = [];
    for (const dataflowUri of pipelineMeta.dataflow) {
      scripts.dataflow.push(await downloadScript(scriptDir, scriptOrder, dataflowUri, ScriptType.Dataflow, enableCache));
      scriptOrder++;
    }
  }
  scripts.model = await downloadScript(scriptDir, scriptOrder, pipelineMeta.model, ScriptType.Model, enableCache);
  return scripts;
};
