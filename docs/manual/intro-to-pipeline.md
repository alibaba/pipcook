# Introduction to Pipeline

In Pipcook, we use Pipeline to represent the training process of a model, so in general, what kind of pipeline is needed to train a model? Developer can use a JSON to describe pipeline of modeling from sample collection, model definition, training to model evaluation:

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

As shown above, a pipeline is composed of different plugins, and we add the field `params` to each plugin to pass given parameters. Then the pipeline interpreter will perform corresponding operation(s) by its plugin type and parameters.

> See [Introduction to Plugin](./intro-to-plugin.md) for more details about plugin.

Next, when we have defined such a pipeline, we can run it through Pipcook.

## Preparation

Follow the [Pipcook Tools Initlization](./pipcook-tools.md#environment-setup) to get the Pipcook ready.

## Run Pipeline

Save the above JSON of your pipeline in anywhere, and run:

```sh
$ pipcook run /path/to/your/pipeline-config.json
```

The trained model will generate an `output` directory under [`cwd(3)`](https://linux.die.net/man/3/cwd):

```
📂output
   ┣ 📂logs
   ┣ 📂model
   ┣ 📜package.json
   ┣ 📜metadata.json
   ┗ 📜index.js
```

To get started with your trained model, just using:

```js
import * as predict from './output';
predict('your input data');
```
