import boa from '../lib/index.js';
const { dir } = boa.builtins();
const extensionsPrefix = 'py:';
const protocol = 'nodejs://boa/';

export function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith(extensionsPrefix)) {
    return {
      url: protocol + specifier.replace(extensionsPrefix, '')
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  // DynamicInstantiate hook triggered if boa protocol is matched
  if (url.startsWith(protocol)) {
    return {
      format: 'dynamic',
    }
  }

  // Other protocol are assigned to nodejs for internal judgment loading
  return defaultGetFormat(url, context, defaultGetFormat);
}

export function dynamicInstantiate(url) {
  const moduleInstance = boa.import(url.replace(protocol, ''));
  // Get all the properties of the Python Object to construct named export
  const moduleExports = dir(moduleInstance);
  return {
    exports: ['default', ...moduleExports],
    execute: exports => {
      for (let name of moduleExports) {
        exports[name].set(moduleInstance[name]);
      }
      exports.default.set(moduleInstance);
    }
  };
}
