# Introduction to Pipeline

We use a JSON to describe our pipeline of modeling from sample collection, model definition, training to model evaluation:

```js
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-csv-data-collect",
      "params": {
        "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip"
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

```sh
$ pipcook init
```

To use custom npm client:

```sh
$ pipcook init -c cnpm
```

To use [tuna mirror](https://mirrors.tuna.tsinghua.edu.cn/) for Python:

```sh
$ pipcook init --tuna
```

## Run Pipeline

Save the JSON of your pipeline in the initialized directory, and run:

```sh
$ pipcook run /path/to/your/pipeline.json
```

## View Pipeline

We provide a Web-based tool for viewing your Pipelines on your browser:

```sh
$ pipcook board
```
