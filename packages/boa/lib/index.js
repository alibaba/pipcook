'use strict';

const vm = require('vm');
const path = require('path');
const native = require('bindings')('boa');

const {
  notEmpty,
  getIndent,
  removeIndent,
  asHandleObject,
  GetOwnershipSymbol,
  PyGetAttrSymbol,
  PySetAttrSymbol,
  PyGetItemSymbol,
  PySetItemSymbol,
} = require('./utils');
const { SharedPythonObject } = require('./worker');
const { condaPath, pyInst, globals, builtins } = require('./factory');
const { wrap, _internalWrap } = require('./proxy');

const importedNames = [];
const sharedModules = ['sys', 'torch'];
let defaultSysPath = [];

// reset some envs for Python
setenv(null);

function setenv(externalSearchPath) {
  const sys = pyInst.import('sys');
  if (!defaultSysPath || !defaultSysPath.length) {
    defaultSysPath = vm.runInThisContext(sys.__getattr__('path').toString()) || [];
  }
  const sysPath = Object.assign([], defaultSysPath);
  sysPath.push(path.join(condaPath, 'lib/python3.7/lib-dynload'));
  if (externalSearchPath) {
    sysPath.push(externalSearchPath);
  }
  sys.__setattr__('path', sysPath);

  // reset the cached modules that imported before.
  for (let name of importedNames) {
    name.split('.').reduce((ns, n, i) => {
      const nss = ns + (i === 0 ? n : `.${n}`);
      sys.__getattr__('modules').__delitem__(nss);
      return nss;
    }, '');
  }
  // set `length` to zero to release all references of the array.
  importedNames.length = 0;
}

// shadow copy an object, and returns the new copied object.
function copy(T) {
  const fn = pyInst.import('copy').__getattr__('copy');
  return fn.invoke(asHandleObject(T));
}

function asBytesObject(str) {
  return {
    [native.NODE_PYTHON_VALUE_NAME]: str,
    [native.NODE_PYTHON_BYTES_NAME]: true,
  };
}

module.exports = {
  /**
   * Reset the Python module environment, it clears the `sys.modules`, and
   * add the given search paths if provided.
   * @param {string} extraSearchPath
   */
  setenv,
  /**
   * @class SharedPythonObject
   */
  SharedPythonObject,
  /*
   * Import a Python module.
   * @method import
   * @param {string} name - the module name.
   */
  'import': name => {
    const pyo = wrap(pyInst.import(name));
    if (sharedModules.indexOf(name) === -1 &&
      importedNames.indexOf(name) === -1) {
      importedNames.push(name);
    }
    return pyo;
  },
  /*
   * Get the builtins
   * @method builtins
   */
  'builtins': () => _internalWrap(builtins),
  /**
   * Create a bytes object.
   * @method bytes
   * @param {string|Buffer|TypedArray} data - the input data.
   */
  'bytes': data => asBytesObject(data),
  /**
   * Create a keyword arguments objects.
   * @method kwargs
   * @param {object} input - the kwargs input.
   */
  'kwargs': input => {
    if (typeof input !== 'object') {
      throw new TypeError('input must be an object.');
    }
    return Object.assign({}, input, {
      [native.NODE_PYTHON_KWARGS_NAME]: true,
    });
  },
  /**
   * With-statement function, See:
   * https://docs.python.org/3/reference/compound_stmts.html#the-with-statement
   * @method with
   * @param {function} fn
   */
  'with': (ctx, fn) => {
    if (typeof ctx.__enter__ !== 'function' ||
      typeof ctx.__exit__ !== 'function') {
      throw new TypeError('the context object must have the ' +
                          'magic methods: `__enter__`, `__exit__`.');
    }
    if (typeof fn !== 'function') {
      // FIXME(Yorkie): should call __exit__ before throwing the error.
      ctx.__exit__(null, null, null);
      throw new TypeError('the `fn` must be a function.');
    }
    return (async () => {
      let hitException = false;
      let v = null;
      try {
        v = await fn(ctx.__enter__());
      } catch (err) {
        hitException = true;
        if (!ctx.__exit__(
            asHandleObject(err.ptype),
            asHandleObject(err.pvalue),
            asHandleObject(err.ptrace))) {
          // TODO(Yorkie): throw an new error that hides python objects?
          throw err;
        }
      } finally {
        if (!hitException) {
          ctx.__exit__(null, null, null);
        }
      }
      return v;
    })();
  },
  /**
   * Evaluate a Python expression.
   * @param {string} strs the Python exprs.
   */
  'eval': (strs, ...params) => {
    let src = '';
    let env = globals;
    if (typeof strs === 'string') {
      src = strs
    } else if (strs.length === 1) {
      [src] = strs;
    } else {
      let idx = 0;
      env = copy(globals);
      src = strs.reduce((acc, str) => {
        let next = acc
        next += str;
        if (idx < params.length) {
          const k = `boa_eval_var_${idx}`;
          const v = params[idx];
          env.__setitem__(k, v);
          next += k;
          idx += 1;
        }
        return next;
      }, src);
    }
    // for multiline executing.
    const lines = src.split('\n').filter(notEmpty);
    const indent = getIndent(lines);
    return wrap(pyInst.eval(
      lines.map(removeIndent(indent)).join('\n'),
      { globals: env, locals: env }
    ));
  },
  
  /**
   * Symbols
   */
  symbols: {
    /**
     * The symbol is used to get the ownership value on an object.
     */
    GetOwnershipSymbol,
    /**
     * __getattr__
     */
    PyGetAttrSymbol,
    /**
     * __setattr__
     */
    PySetAttrSymbol,
    /**
     * __getitem__
     */
    PyGetItemSymbol,
    /**
     * __setitem__
     */
    PySetItemSymbol,
  },
};
