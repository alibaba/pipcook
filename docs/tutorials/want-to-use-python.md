# Boa (Python Bridge Layer)

Using Python functions seamlessly in Node.js, it delivers any Python module for Node.js developer in lower-cost to learn or use.

## Dependencies

- Node.js 10, 12
- Platforms
  - MacOS
  - Linux

> Note: we integrate Python3.7 via conda, no necessary to install Python by yourself.

## Virtual Environment

If you are using virtualenv or conda, you can just set up your system environment PYTHONPATH to point to your site-packages folder. For instance

```sh
$ export PYTHONPATH = /Users/venv/lib/python3.7/site-packages
```

## How to install packages

By default, Boa will install a conda virtual environment under the path of Boa package. To make it easier to install python libraries, you can run
```sh
$ ./node_modules/.bin/bip install <package-name>
``` 
> `bip` is an alias of pip which points to correct Python environment.

## Get started

Let's have a glance on how to call to Python's function:

```js
const boa = require('@pipcook/boa');
const os = boa.import('os');
console.log(os.getpid()); // prints the pid from python.

// using keyword arguments namely `kwargs`
os.makedirs('..', boa.kwargs({
  mode: 0x777,
  exist_ok: false,
}));

// using bult-in functions
const { range, len } = boa.builtins();
const list = range(0, 10); // create a range array
console.log(len(list)); // 10
console.log(list[2]); // 2
```

## How to build

```bash
# clone this project firstly.
$ npm install
$ npm run build
```

__Verify if the generated library is linked to correct Python version__

When buidling finished, use `objdump -macho -dylibs-used ./build/Release/boa.node` to check if your linked libs are correct as:

```bash
/build/Release/boa.node:
  /usr/local/opt/python/Frameworks/Python.framework/Versions/3.7/Python (compatibility version 3.7.0, current version 3.7.0)
  /usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 400.9.4)
  /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.250.1)
```

## API Design Principle

A Connection between 2 languages(ecosystems) has huge works to be done, even though this package is working only on the unilateral from Python to JavaScript. The most difficult part is that for developers, they need to understand the correspondence between the two languages and ecosystems. Therefore, a good design principle will make developers reduce learning costs.

### `boa`

`require('@pipcook/boa')` returns the root object, which will be your entry point to all Python functions, and it provides these methods:

#### `.builtins()`

Gets the Python's [built-in functions](https://docs.python.org/3/library/functions.html), for example:

```js
const { len, range } = boa.builtins();
len([1, 2, 3]); // 3
len(range(0, 10)); // 10
```

#### `.import(mod)`

Imports a Python module in your current environment, the module includes:

- system modules like `os`, `string` and `re`.
- third-party modules like `numpy` and `request` via [pip](https://pip.pypa.io/en/stable/installing/).

To call the function, you should pass a `mod` argument for the module that you want to import.

```js
const os = boa.import('os');
const str = boa.import('string');
const numpy = boa.import('numpy');
```

This returns an instance of [`PythonObjectWrapper`](#class-PythonObjectWrapper) or a JavaScript primitive value for some special cases.

#### `.kwargs(map)`

Creates a Python's keyword arguments, Python provides a way to map arguments with names:

```python
fs.open('./a-file-to-open', mode=0e777)
```

Correspondingly, this function is used to represent a keyword arguments, and the specific usage is very easy to understand:

```js
const fs = boa.import('fs');
fs.open('./a-file-to-open', boa.kwargs({ mode: 0e777 }));
```

#### `.with(ctx, fn)`

It's equivalent to the _with-statement_ in Python, this would be called with an object `ctx` that supports the context management protocol (that is, has `__enter__()` and `__exit__()` methods). And 2nd `fn` is corresponding to the execution block, A simple example is as follows:

```js
boa.with(localcontext(), (ctx) => {
  // execution
  // the ctx is localcontext().__enter().
});
```

#### `.eval(str)`

Execute Python expression in the context specified, here is a simple call:

```js
boa.eval('len([10, 20])');
// 2
```

Alternatively, developers can use [tagged template literal][] to pass variables that have been defined in JavaScript:

```js
const elem = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
boa.eval`${elem} + 100`;  // do matrix + operation
boa.eval`len(${elem})`;   // equivalent to `len(elem)`
```

For multi-line code, Python 3 does not provide a mechanism to return a value, so the `eval` function can only handle single-line Python expressions.

#### `.bytes(str)`

A shortcut to create a Python's bytes literal from JavaScript string, it's equivalent to `b'foobar'` in Python.

```js
const { bytes } = boa;
bytes('foobar'); // "b'foobar'"
```

The `bytes(str)` function simply creates a plain object that is used to pass a string to a Python function as a bytes literal, but does not correspond to any Python object itself. Alternatively, you could use Python's [builtin class `bytes`](https://docs.python.org/3/library/stdtypes.html#bytes) for creating a real object:

```js
const { bytes } = boa.builtins();
const foobar = Buffer.from('foobar');
bytes.fromhex(foobar.toString('hex'));
// "b'foobar'"
```

### Class `PythonObjectWrapper`

This class represents a wrapper for the corresponding object in Python runtime, it must be returned only from [`boa`](#boa) methods like `boa.builtins` and `boa.import`.

#### creation of instance

In order for developers to use Python objects seamlessly, creating a [`PythonObjectWrapper`](#class-PythonObjectWrapper) requires some necessary steps.

First, check the type of the Python object under instance. If it is one of the following types, it will be converted to the corresponding primitive type.

| python type   | primitive    |
|---------------|--------------|
| `int`,`float` | `number`     |
| `int64`       | `bigint`     |
| `float64`     | `bigdecimal` |
| `bool`        | `boolean`    |
| `str`         | `string`     |
| `NoneType`    | `null`       |

If the type of the object that needs to be wrapped is not in the above primitive, a temporary object will be created, and methods and properties will be defined through `Object.defineProperties`.

On an instance of [`PythonObjectWrapper`](#class-PythonObjectWrapper), developers can directly obtain values through the property way, just like using those in Python. This is because we use [ES6 Proxy][], so the last step, we created a `Proxy` Object, configured with 3 trap handlers, `get`, `set` and `apply`, and finally returns this proxy object.

#### property accessor

At [Python][] language, an object has _attr_ and _item_ accessors, and they use different expressions:

- `x.y` is for _attr_ accessor
- `m[n]` is for _item_ accessor

Unfortunately, [ES6 Proxy][] does not distinguish the above things. Therefore, it's needed to define an algorithm to confirm their priority in a time of operation.

- given a `name` variable which is passed by [ES6 Proxy][]'s `get` handler.
- check the `name` property is owned by the JavaScript object via `.hasOwnProperty()`.
  - return the property if it's truthy.
- check the `name` property is owned by the object's class via `.constructor.prototype.hasOwnProperty()`.
  - return the property if it's truthy.
- check if `name` is a numeric representation.
  - if it's truthy, call the internal method `.__getitem__(i)` for item accessor.
  - otherwise
    - try to access the _attr_ via the internal method `.__getattr__()`.
      - if no exceptions, [create the new instance](#creation-of-instance) from the value and return.
    - try to access the _item_ via the internal method `.__getitem__()`.
      - if no exceptions, [create the new instance](#creation-of-instance) from the value and return.
    - otherwise, return `undefined`.

To better understand the algorithm above, let's look at some examples:

```js
const boa = require('@pipcook/boa');
const { abs, tuple } = boa.builtins();

{
  console.log(abs(-100));  // 100
  console.log(abs(100));   // 100
}
{
  const re = boa.import('re');
  const m = re.search('(?<=abc)def', 'abcdef');
  console.log(m.group(0)); // 'def'
}
{
  // make sure the `numpy` is in your current python env.
  const np = boa.import('numpy');
  const x0 = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
  const x1 = np.arange(15).reshape(3, 5);
  const x2 = np.zeros(tuple([3, 4]));
}
```

As mentioned above, in addition to dynamically obtaining objects from the [Python][] runtime, the class `PythonObjectWrapper` also defines the following public methods built into JavaScript.

#### `.prototype.toString()`

Returns a string for representing the object, internally it calls the CPython's [`PyObject_Str`](https://docs.python.org/3/c-api/object.html#c.PyObject_Str).

```js
console.log(boa.import('os').toString());
// "<module 'os' from '/usr/local/opt/python/Frameworks/Python.framework/Versions/3.7/lib/python3.7/os.py'>"
```

#### `.prototype.slice(start, stop, step)`

Returns a new wrapped slice object, it's equivalent to `s[start:stop:step]`. For example:

```js
const { range } = boa.builtins();
const mlist = range(0, 10); // [0...10]
const s = mlist.slice(2, 10, 1); // [2...10]
```

> Note: a new tc39 proposal [slice notation](https://github.com/tc39/proposal-slice-notation) attempts to add this kind of syntax, it'll be merged when it's land on v8 engine. Or try with `eval` in Python's syntax:
>
> ```js
> boa.eval`${mlist}[0...10]`
> boa.eval`${mlist}[1:10:2]`
> ```

#### `.prototype.__hash__()`

Returns the hash value of this object, internally it calls the CPython's [`PyObject_Hash`](https://docs.python.org/3/c-api/object.html#c.PyObject_Hash).

> __Magic methods__ there are some others like `__getitem__`, `__setitem__`, `__getattr__`, `__setattr__` which are used internally in this library, it's not recommended to actively use them at user-land.

#### `.prototype[Symbol.toPrimitive](hint)`

Returns a corresponding primitive value for this object, see [`Symbol.toPrimitive` on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) for more details.

## Working with ECMAScript Modules
> Requires Node.js >= `v12.11.1`

Use Node.js custom loader for better import-statement.
```js
// app.mjs
import { range, len } from 'py:builtins';
import os from 'py:os';
import {
  array as NumpyArray,
  int32 as NumpyInt32,
} from 'py:numpy';

console.log(os.getpid()); // prints the pid from python.

const list = range(0, 10); // create a range array
console.log(len(list)); // 10
console.log(list[2]); // 2

const arr = NumpyArray([1, 2, 3], NumpyInt32); // Create an array of int32 using ndarry constructor
console.log(arr[0]); // 1
```

In `Node.js v14.x` you can specify only [`--experimental-loader`](https://nodejs.org/dist/latest-v14.x/docs/api/cli.html#cli_experimental_loader_module) to launch your application:

```sh
$ node --experimental-loader @pipcook/boa/esm/loader.mjs app.mjs
```

In Node.js version < `v14.x`, you also need to add the [`--experimental-modules`](https://nodejs.org/dist/latest-v14.x/docs/api/cli.html#cli_experimental_modules) option:
```sh
$ node --experimental-modules --experimental-loader @pipcook/boa/esm/loader.mjs app.mjs
```

## Tests

To run the full tests:

```bash
$ npm test
```

See [./tests](https://github.com/alibaba/pipcook/tree/master/packages/boa/tests) for more testing details.

[Python]: https://docs.python.org/3/
[ES6 Proxy]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[tagged template literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Description
