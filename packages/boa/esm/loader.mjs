import boa from '../lib/index.js';
const { dir } = boa.builtins();
const protocol = 'py:';

export function resolve(specifier, context, defaultResolve) {
  // modify context to route boa libraries in 'py:*' packages
  if (context.parentURL && context.parentURL.startsWith(protocol)) {
    context.parentURL = import.meta.url;
  }
  if (specifier.startsWith(protocol)) {
    return {
      url: specifier
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}

export function getFormat(url, context, defaultGetFormat) {
  // DynamicInstantiate hook triggered if boa protocol is matched
  if (url.startsWith(protocol)) {
    return {
      // original 'dynamic' is deprecated by node v14.8.0
      format: 'module'
    }
  }

  // Other protocol are assigned to nodejs for internal judgment loading
  return defaultGetFormat(url, context, defaultGetFormat);
}

// deprecated by node v14.8.0
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

// alternative dynamic loader
export async function getSource(url, context, defaultGetSource) {
  if (url.startsWith(protocol)) {
    const moduleInstance = boa.import(url.replace(protocol, ''));
    const moduleExports = Array.from(dir(moduleInstance) || []);
    return {
      source: `
import boa from '../lib/index.js';

const moduleInstance = boa.import('${url.replace(protocol, '')}');

${moduleExports.map(name => `const __boa__${name} = moduleInstance['${name}'];`).join('\n')}

export {
${moduleExports.map(name => `  __boa__${name} as ${name},`).join('\n')}
};
export default moduleInstance;`
    };
  }
  return defaultGetSource(url, context, defaultGetSource);
}