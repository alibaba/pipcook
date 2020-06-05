# Boa 使用指南

Boa 是 Pipcook 中的 Python桥接层，它可以让开发者在 Node.js 中无缝调用 Python 函数，它为 Node.js 开发人员提供了成本更低的学习和使用 Python 的任何模块。

## 快速开始

让我们先来看一个简单的例子：

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

## 安装 Python 包

默认情况下，Boa 将在安装目录下初始化一个基于 conda 的虚拟环境。为了使安装 Python 库更容易，您可以运行：

```sh
$ ./node_modules/.bin/bip install <package-name>
``` 

> `bip` 是 pip 的快捷方式

## 接口文档

即使在 Boa 的实现中，我们只需要实现从 Python 到 JavaScript 的场景，要完全连接2种编程语言的生态也有很多工作要完成，对于开发者来说，最困难的部分是他们需要了解两种语言和生态系统之间的对应关系。因此，良好的设计可以让使用者降低学习成本。

### `boa`

`require('@pipcook/boa')` 返回根对象，它将是访问到所有 Python 函数的入口，它提供以下的方法：

#### `.builtins()`

返回 [Python 内置函数](https://docs.python.org/3/library/functions.html)，使用方式如下：

```js
const { len, range } = boa.builtins();
len([1, 2, 3]); // 3
len(range(0, 10)); // 10
```

#### `.import(mod)`

在当前环境导入一个 Python 包，包括：

- 系统包括，如 `os`, `string` 和 `re`。
- 第三方包，如 `numpy` 和 `request`，可以通过查看 [PyPI](https://pypi.org)。

通过传入一个 `mod` 参数来告诉 Boa 你想要导入的 Python 包：

```js
const os = boa.import('os');
const str = boa.import('string');
const numpy = boa.import('numpy');
```

它返回一个 [`PythonObjectWrapper`](#class-PythonObjectWrapper) 实例对象，或者是 JavaScript 值。

#### `.kwargs(map)`

创建一个 Python 命名参数，通过这种方式调用者可以为每个参数定义一个名字：

```python
fs.open('./a-file-to-open', mode=0e777)
```

因此，`.kwargs(map)` 用于表示一个命名参数，使用方式十分容易理解，如下：

```js
const fs = boa.import('fs');
fs.open('./a-file-to-open', boa.kwargs({ mode: 0e777 }));
```

#### `.with(ctx, fn)`

等价于 Python 中的 `with` 语句，这个函数接受一个 `ctx` 对象，它支持 Python 的上下文管理协议（即实现了 `__enter__()` 和 `__exit__()` 方法）。第二个参数 `fn` 是执行块，在获取到 `ctx` 执行调用，一个简单的例子如下：

```js
boa.with(localcontext(), (ctx) => {
  // execution
  // the ctx is localcontext().__enter().
});
```

#### `.eval(str)`

在特定的上下文，执行 Python 表达式，如：

```js
boa.eval('len([10, 20])');
// 2
```

另外，开发者也可以使用 [tagged template literal][]，它允许开发者向表达式中传递定义在 JavaScript 中的变量对象：

```js
const elem = np.array([[1, 2, 3], [4, 5, 6]], np.int32);
boa.eval`${elem} + 100`;  // do matrix + operation
boa.eval`len(${elem})`;   // equivalent to `len(elem)`
```

由于 Python3 并不支持通过多行代码返回值，因此 `eval` 函数也只能支持执行单行的表达式。

#### `.bytes(str)`

通过它，可以快速创建 Python 的 `bytes` 子面量，等价于 Python 中的 `b'foobar'`。

```js
const { bytes } = boa;
bytes('foobar'); // "b'foobar'"
```

`bytes(str)` 函数创建一个对象，它允许开发者通过 JavaScript 的字符串来传递一个 `bytes` 子面量的参数，但它本身并不创建真正的 Python 对象。如果你想创建一个 `bytes` 对象，你应该使用 [builtin class `bytes`](https://docs.python.org/3/library/stdtypes.html#bytes)。

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

On an instance of [`PythonObjectWrapper`](#class-PythonObjectWrapper), developers can directly obtain values through the property way, just like using those in Python. This is because we use [ES6 Proxy][], so the last step, we created a `Proxy` Object, configured with 3 trap handlers, `get`, `set`, `apply`, and finally returns this proxy object.

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

## 使用 ECMAScript Modules

> 要求 Node.js >= `v12.11.1`

使用 Node.js 自定义加载器提供更好的导入语句：

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

在 `Node.js v14.x` 中，你只需要声明 [`--experimental-loader`](https://nodejs.org/dist/latest-v14.x/docs/api/cli.html#cli_experimental_loader_module) 即可使用：

```sh
$ node --experimental-loader @pipcook/boa/esm/loader.mjs app.mjs
```

在 Node.js 版本小于 `v14.x`, 你还需要额外增加参数 [`--experimental-modules`](https://nodejs.org/dist/latest-v14.x/docs/api/cli.html#cli_experimental_modules)，因为 ESM 还在实验阶段：

```sh
$ node --experimental-modules --experimental-loader @pipcook/boa/esm/loader.mjs app.mjs
```

## 从源码构建

```bash
# clone this project firstly.
$ npm install
$ npm run build
```

__验证你生成的动态库是否链接到正确的 Python 版本__

构建完成后，使用 `objdump -macho -dylibs-used ./build/Release/boa.node` 查看链接库：

```bash
/build/Release/boa.node:
  /usr/local/opt/python/Frameworks/Python.framework/Versions/3.7/Python (compatibility version 3.7.0, current version 3.7.0)
  /usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 400.9.4)
  /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.250.1)
```

[Python]: https://docs.python.org/3/
[ES6 Proxy]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[tagged template literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Description

## 测试

运行完整的测试用例:

```bash
$ npm test
```

看 [./tests](https://github.com/alibaba/pipcook/tree/master/packages/boa/tests) 获取更多相关的测试内容。

## 配置 Python 虚拟环境

如果你在使用 virtualenv(venv) 或 conda，那么在使用 Boa 前使用 PYTHONPATH 指向你的 site-packages 目录即可：

```sh
$ export PYTHONPATH = /Users/venv/lib/python3.7/site-packages
```
