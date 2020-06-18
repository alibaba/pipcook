const fs = require('fs');
const vm = require('vm');
const util = require('util');
const path = require('path');
const native = require('bindings')('boa');
const debug = require('debug')('boa');
const utils = require('./utils');
const DelegatorLoader = require('./delegator-loader');

// internal symbols
const IterIdxForSeqSymbol = Symbol('The iteration index for sequence');

// read the conda path from the .CONDA_INSTALL_DIR
// eslint-disable-next-line no-sync
const condaPath = fs.readFileSync(path.join(__dirname, '../.CONDA_INSTALL_DIR'), 'utf8');
// eslint-disable-next-line no-process-env
process.env.PYTHONHOME = condaPath;

// create the global-scoped instance
let pyInst = global.__pipcook_boa_pyinst__;
if (pyInst == null) {
  pyInst = new native.Python(process.argv.slice(1));
  global.__pipcook_boa_pyinst__ = pyInst;
}

const importedNames = [];
// FIXME(Yorkie): move to costa or daemon?
const sharedModules = ['sys', 'torch'];
const globals = pyInst.globals();
const builtins = pyInst.builtins();
const delegators = DelegatorLoader.load();
let defaultSysPath = [];

// reset some envs for Python
setenv(null);

function getTypeInfo(T) {
  const typeo = builtins.__getitem__('type').invoke(asHandleObject(T));
  const tinfo = { module: null, name: null };
  if (typeo.__hasattr__('__module__')) {
    tinfo.module = typeo.__getattr__('__module__').toString();
  }
  if (typeo.__hasattr__('__name__')) {
    tinfo.name = typeo.__getattr__('__name__').toString();
  }
  return tinfo;
}

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

function dump(T) {
  return pyInst.import('json')
    .__getattr__('dumps')
    .invoke(asHandleObject(T));
}

function getDelegator(type) {
  if (typeof type === 'string') {
    return delegators[type];
  }
  const { module, name } = type;
  if (Object.prototype.hasOwnProperty.call(delegators, module)) {
    return delegators[module][name];
  }
  return undefined;
}

// The function `wrap(T)` is used to return an object or value for using.
// It depends on the type of `T` in Python world, usually it returns a 
// `Proxy` object that's based on `T`, when the type could be represented
// as number/boolean/string/null, the return value would be converted to
// corresponding JS primative.
function wrap(T) {
  // if `T` is null or undefined, returning itself by default.
  if (T === null || T == undefined) {
    return T;
  }

  const type = getTypeInfo(T);
  debug(`start wrapping an object, and its type is "${type.module}.${type.name}"`);

  // if `type` is "NoneType", returning the null.
  if (type.module === 'builtins' && type.name === 'NoneType') {
    return null;
  }

  // FIXME(Yorkie): directly returning the primitive value on the 
  // following conditions.
  if ([
    /** python types convert to primitive values. */
    'int',  /** Number */
    'int64', /** BigInt */
    'float', /** Number */
    'float64', /** BigDecimal(depends on new tc39 proposal) */
    'bool', /** Boolean */
    'str', /** String */
    /** except for null and undefined */
  ].includes(type.name)) {
    return T.toPrimitive();
  }

  let fn = getDelegator(T.isCallable() ? 'callee' : type);
  if (typeof fn !== 'function') {
    fn = getDelegator('default');
  }
  // use internalWrap to generate proxy object with corresponding delegator.
  const wrapped = _internalWrap(T, fn(T, wrap));
  T[native.NODE_PYTHON_WRAPPED_NAME] = wrapped;
  return wrapped;
}

function asHandleObject(T) {
  return {
    // namely shortcut for Python object.
    [native.NODE_PYTHON_HANDLE_NAME]: T
  };
}

function asBytesObject(str) {
  return {
    [native.NODE_PYTHON_VALUE_NAME]: str,
    [native.NODE_PYTHON_BYTES_NAME]: true,
  };
}

function _internalWrap(T, src={}) {
  Object.defineProperties(src, {
    /**
     * @property native.NODE_PYTHON_WRAPPED_NAME
     * @private
     */
    [native.NODE_PYTHON_HANDLE_NAME]: {
      enumerable: true,
      writable: false,
      value: T,
    },
    /**
     * @method native.NODE_PYTHON_JS_DISPATCH
     * @private
     */
    [native.NODE_PYTHON_JS_DISPATCH]: {
      enumerable: true,
      // FIXME(Yorkie): temporarily set `configurable` to false here.
      // See https://github.com/v8/v8/blob/7.9.317/src/objects/objects.cc#L1176-L1179
      //
      // The proxy object's get trap handler is inconsistent with this descriptor when
      // the value is a function, which means the `inconsistent` to be true, then throwing
      // a `kProxyGetNonConfigurableData` error.
      //
      // In order to better solve, we need to define both `get` and `has` traps in the
      // proxy object, and move descriptors to the trap handler.
      configurable: true,
      writable: false,
      value: function(fn, isClassMethod, ...args) {
        if (isClassMethod) {
          return fn.apply(wrap(args[0]), args.slice(1).map(wrap));
        } else {
          return fn.apply(this, args.map(wrap));
        }
      },
    },
    /**
     * @method invoke
     * @param {object} args
     * @private
     */
    invoke: {
      enumerable: false,
      writable: false,
      value: args => T.invoke.apply(T, args),
    },
    /**
     * @method toString
     * @public
     */
    toString: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: () => T.toString(),
    },
    /**
     * @method toJSON
     * @public
     */
    toJSON: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: () => {
        const type = getTypeInfo(T);
        let str;
        if (type.module === 'numpy') {
          str = dump(T.__getattr__('tolist').invoke());
        } else {
          str = dump(T);
        }
        // TODO(Yorkie): more performant way to serialize objects?
        return JSON.parse(wrap(str));
      },
    },
    /**
     * Shortcut for slicing object.
     * @method slice
     * @public
     */
    slice: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: (start, end, step) => {
        // slice(start, end, step)
        const slice = builtins.__getitem__('slice')
          .invoke(start, end, step);
        // use the slice object as the key for s[x:y:z]
        return wrap(T.__getitem__(asHandleObject(slice)));
      },
    },
    /**
     * This is used to cusom the console.log output by calling toString().
     * @method util.inspect.custom
     * @public
     */
    [util.inspect.custom]: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: () => T.toString(),
    },
    /**
     * @method Symbol.toPrimitive
     * @param {string} hint
     * @public
     */
    // Forward compatible with newer `toPrimitive` spec
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive
    [Symbol.toPrimitive]: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: () => T.toString(),
    },
    /**
     * Implementation of ES iterator protocol, See:
     *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
     *
     * @method Symbol.iterator
     * @public
     */
    [Symbol.iterator]: {
      configurable: true,
      enumerable: false,
      writable: false,
      value: () => {
        if (T.isIterator()) {
          return {
            next: () => {
              const curr = T.next();
              return {
                done: curr.done,
                value: wrap(curr.value),
              };
            },
          };
        }
        if (T.isSequence()) {
          return {
            next: function next() {
              if (typeof this[IterIdxForSeqSymbol] === 'number') {
                this[IterIdxForSeqSymbol] += 1;
              } else {
                this[IterIdxForSeqSymbol] = 0;
              }
              const lengthOfSeq = builtins.__getitem__('len')
                .invoke(asHandleObject(T)).toPrimitive();
              const index = this[IterIdxForSeqSymbol];
              if (index >= lengthOfSeq) {
                return { done: true, value: undefined };
              }
              return {
                done: false,
                value: wrap(T.__getitem__(index)),
              };
            }
          };
        }
        throw new TypeError('object is not iteratable or sequence.');
      },
    },
    /**
     * @method __hash__
     * @public
     */
    __hash__: {
      configurable: true,
      enumerable: true,
      writable: false,
      value: () => T.__hash__(),
    },
  });

  // Create the proxy object for handlers
  let newTarget;
  return (newTarget = new Proxy(src, {
    'get'(target, name) {
      debug(`get property on "${target.constructor.name}", ` +
            `name is "${name.toString()}"`);

      const { hasOwnProperty } = Object.prototype;
      const constructProto = target.constructor.prototype;
      if (hasOwnProperty.call(target, name) /* check for own property */ ||
        hasOwnProperty.call(constructProto, name) /* check for inherited one-level */
      ) {
        const value = target[name];
        debug(`found "${name.toString()}" from object own properties ` +
              `or one-level properties.`);

        if (typeof value === 'function') {
          // FIXME(Yorkie): make sure the function's this is correct.
          return value.bind(newTarget);
        } else {
          return value;
        }
      }

      /** Enter the Python world. */
      if (typeof name === 'string') {
        if (/^[0-9]+$/.test(name)) {
          debug('name is detected to be an index.');
          const n = parseInt(name, 10);
          return wrap(T.__getitem__(n));
        }
        if (T.__hasattr__(name)) {
          debug(`found "${name}" as python attr`);
          return wrap(T.__getattr__(name));
        }
      }

      try {
        const r = T.__getitem__(name);
        if (r != null) {
          debug(`found "${name.toString()}" as python item`);
          return wrap(r);
        }
      } catch (e) {
        debug(`accessing the item["${name.toString()}"] failed ` +
              `with ${e.message}`);
      }
    },
    'set'(target, name, value) {
      if (typeof name === 'string') {
        if (/^[0-9]+$/.test(name)) {
          return T.__setitem__(parseInt(name, 10), value) !== -1;
        }
        if (T.__hasattr__(name)) {
          return T.__setattr__(name, value) !== -1;
        }
      }
      let r = T.__setitem__(name, value);
      if (r === -1) {
        r = T.__setattr__(name, value);
      }
      return r !== -1;
    },
    'apply'(target, thisArg, argumentsList) {
      return wrap(target.invoke(argumentsList));
    },
    'construct'(target, argumentsList, newClass) {
      if (newClass.name === 'PythonCallable') {
        return wrap(target.invoke(argumentsList));
      }
      if (!newClass.prototype.$pyclass) {
        const pyclass = T.createClass(newClass.name, target);
        Object.getOwnPropertyNames(newClass.prototype)
          .filter(name => name !== 'constructor' || name !== '__init__')
          .forEach(name => {
            pyclass.setClassMethod(name, newClass.prototype[name]);
          });
        newClass.prototype.$pyclass = wrap(pyclass);
      }
      // return the instance
      return newClass.prototype.$pyclass.apply(null, argumentsList);
    },
  }));
}

module.exports = {
  /**
   * Reset the Python module environment, it clears the `sys.modules`, and
   * add the given search paths if provided.
   * @param {string} extraSearchPath
   */
  setenv,
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
      throw new TypeError('input must be a string.');
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
    const lines = src.split('\n').filter(utils.notEmpty);
    const indent = utils.getIndent(lines);
    return wrap(pyInst.eval(
      lines.map(utils.removeIndent(indent)).join('\n'),
      { globals: env, locals: env }
    ));
  },
};
