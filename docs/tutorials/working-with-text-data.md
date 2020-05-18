# Working with text data

The goal of this guide is to explore some of Pipcook plugins on a single practical task: Text Classification.

In this section we will see how to:

1. load the file contents and the categories.
2. configure a plugin which converts sample to a CSV suitable.
3. train a bayesian model to perform categorization.

## Setup

To get started with this tutorial, you must first install [Pipcook][] and all of its required dependencies. Please refer to the [installation instructions](../INSTALL.md) page for more information.

The pipeline source of this tutorial can be found [on GitHub](https://github.com/alibaba/pipcook/blob/master/example/pipelines/text-bayes-classification.json).

Before starting, you also need to create a project via:

```sh
$ pipcook init
```

## Loading the Commodity Dataset

We provide an open dataset called "Commodity Dataset", which contains the title of commodities with its category:

- "itemTitle", a product title.
- "shopName", a shop name.
- "itemDesc", the description of a product.

It's easy to load this dataset, add the following plugin in your pipeline:

```js
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-csv-data-collect",
      "params": {
        "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/textClassification.zip"
      }
    },
  }
}
```

The plugin "@pipcook/plugins-csv-data-collect" is used to load our csv

[Pipcook]: https://github.com/alibaba/pipcook
