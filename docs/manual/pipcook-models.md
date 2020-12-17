# Introduction to Pipcook models

Pipcook now supports two types (Node.js & wasm) of model. In this manual, we will dive into these two types of models and show users how to use them.

## nodejs

### Background

Node.js models are powered by boa, a python-js bridge that allows users to directly run python module with Javascript syntax.

The common folder structure for such model is like:
```
├── boapkg.js
├── index.js
├── metadata.json
├── model
└── package.json
```

The black magic here is to use boa to connect Javascript and python. This will allow users to use the flourish python eco-system and powerful pc serving as backend in nodejs.

But the trade-off is a heavy runtime and long installation time.

### How to use

To use the nodejs model, the following steps are needed:

```bash
$ cd output/nodejs
$ npm install # To install deps
```

Then just treat the `output/nodejs` as an npm package with `predict` function. You can include it in any nodejs runtime. And use the following code to call the model:
```js

```

## WASM

### Background

To give a more portable and user-friendly model solution, pipcook uses TVM to compile a given model to wasm format. In this way, the model can run in both browser and nodejs natively. However, since the standard for webGPU is not stable yet, Pipcook does not target the compiled model to GPU yet. In another word, **WASM format only works for CPU right now**.

THe generated folder structure looks like:

```
├── browser.js
├── node.js
├── model.wasi.js
├── model.wasi.wasm
├── modelDesc.json
├── modelParams.parmas
├── modelSpec.json
└── tvmjs.bundle.js
```

### How to use

The entry files are `browser.js` and `node.js`, as the name suggests, they are prepared for browser environment and nodejs environment.
To run the model, users just need to include the corresponding entry file and call the `predict` function. 

Node.js:
```js
const model = require('./node.js');
const data = [0, 1, 2, 3]; // Mock data, the real data layout depends on model's define
const res = model.predict(data); // return type is Float32Array
```

Browser:
```js
const model = require('./node.js');
const data = [0, 1, 2, 3]; // Mock data, the real data layout depends on model's define
const res = model.predict(data); // return type is Float32Array
```
