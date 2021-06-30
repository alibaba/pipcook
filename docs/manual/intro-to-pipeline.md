# Introduction to Pipeline

In Pipcook, we use Pipeline to represent the training process of a model, so in general, what kind of pipeline is needed to train a model? The developer can use a JSON to describe pipeline of modeling from sample collection, model definition, training to model evaluation:

```js
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-csv-data-collect",
      "params": {
        "url": "http://foobar"
      }
    },
    "dataAccess": {
      "package": "@pipcook/plugins-csv-data-access",
      "params": {
        "labelColumn": "output"
      }
    },
    "modelDefine": {
      "package": "@pipcook/plugins-bayesian-model-define"
    },
    "modelTrain": {
      "package": "@pipcook/plugins-bayesian-model-train"
    },
    "modelEvaluate": {
      "package": "@pipcook/plugins-bayesian-model-evaluate"
    }
  }
}
```

As shown above, a pipeline is composed of different plugins, and we add the field `params` to each plugin to pass given parameters. Then the pipeline interpreter will perform the corresponding operation(s) by its plugin type and parameters.

> See [Introduction to Script](./intro-to-script.md) for more details about Pipcook script.

Next, when we have defined such a pipeline, we can run it through Pipcook.

## Preparation

Follow the [Pipcook Tools Installation](./pipcook-tools.md) to get the Pipcook ready.

## Run Pipeline

Save the above JSON of your pipeline in anywhere, and run:

```sh
$ pipcook run /path/to/your/pipeline-config.json
```

The trained model will generate an `output` directory under [`cwd(3)`](https://linux.die.net/man/3/cwd):

```
output
├─ logs
├─ nodejs
└─ wasm
```

There are two entry-points here, one for Node.js powered by boa; another one is used for wasm (WebAssembly), a universial virtual machine, powered by [TVM](https://tvm.apache.org/docs/).

**Note:** [TVM](https://tvm.apache.org/docs/) does not have linux wheel at this time, therefore, we will only export WASM format for mac platform at this time. We will provide a detailed guide for linux users to build TVM from source, if you want to try it out under linux.

To get started with your trained model, follow the below steps under `nodejs` and `wasm` seperately:

```sh
$ npm install
```

It will install dependencies which contain the plugins and Python packages. Pipcook provides a way to use [tuna mirror](https://mirrors.tuna.tsinghua.edu.cn/) when it downloads Python and packages:

```sh
$ BOA_TUNA=1 npm install
```

Once the output is initialized, just `import` it as the following:

```js
import * as predict from './output';
predict('your input data');
```

**Note:** The wasm format is under experiment, in theory, the generated model should be possible to run with GPU via WebGPU. However, the standard for WebGPU is not finalized. We only enable CPU mode by default at this time.