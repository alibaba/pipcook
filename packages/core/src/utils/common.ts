import { PluginSourceProtocol } from '../types/plugins';
import * as url from 'url';
import * as path from 'path';

/**
 * parse plugin name, return the plugin protocol and url object
 */
export function parsePluginName(name: string): { protocol: PluginSourceProtocol; urlObject: url.UrlWithStringQuery } {
  const urlObject = url.parse(name);
  let protocol: PluginSourceProtocol;
  if (path.isAbsolute(name)) {
    protocol = 'fs';
  } else if (urlObject.protocol && /^git(\+ssh|\+https|\+http)?:$/.test(urlObject.protocol)) {
    protocol = 'git';
  } else if (urlObject.protocol && urlObject.path && [ 'https:', 'http:' ].indexOf(urlObject.protocol) !== -1
    && (urlObject.path.endsWith('.tgz') || urlObject.path.endsWith('.gz'))) {
    protocol = 'tarball';
  } else if (name[0] !== '.' && !urlObject.protocol) {
    protocol = 'npm';
  } else {
    throw new TypeError(`Unsupported resolving plugin name: ${name}`);
  }
  return { protocol, urlObject };
}
