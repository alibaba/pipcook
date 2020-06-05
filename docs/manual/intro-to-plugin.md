# Introduction to Plugin

In Pipcook, each Pipeline represents a machine learning task, so how do we define the machine learning pipeline? Pipcook uses plugins to define and declare different stages in the pipeline. For example, a text classification task is composed of the following plugins:

- `@pipcook/plugins-csv-data-collect` downloads the dataset through the data collect plugin.
- `@pipcook/plugins-csv-data-access` processes the downloaded dataset into a format that the model can use.
- `@pipcook/plugins-bayesian-model-define` defines text classification model, [naive bayes classifier](https://en.wikipedia.org/wiki/Naive_Bayes_classifier).
- `@pipcook/plugins-bayesian-model-train` inputs the training set to the classifier and train.
- `@pipcook/plugins-bayesian-model-evaluate` inputs the testing set to evaluate model accuracy.

> Pipeline source code defined above is [here](https://github.com/alibaba/pipcook/blob/master/example/pipelines/text-bayes-classification.json).

From the above example, we can see that for a text classifier, we follow the machine learning workflow, that orders different types of subtasks as a plugin to allow Pipeline users to refer to it. Users can quickly adjust the task itself at a lower cost.

Next, let's take a look at the types of plugins and its plugins.

#### plugin `DataCollect`

It is used to collect different types of datasets into the pipeline, usually need to define parameters such as `datasetUrl` to obtain the data source. To facilitate the easy implementation of the following plugins, we define the output format of `DataCollect` is determined, according to the text and image:

- it outputs csv format for text tasks.
- it outputs [coco dataset](http://cocodataset.org/) format for image tasks.

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-collect).

#### plugin `DataAccess`

It converts the dataset to the format required by the following model and loads the data into the corresponding dataset [`DataLoader`][].

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-access).

#### plugin `DataProcess`

It is generally used after `DataAccess` and is used to perform some preprocessing on the data in the [`DataLoader`][] before training. Besides, after the model training is completed, Pipcook will use the corresponding `DataProcess` plugin to pre-process the predicted data before predicting, which can reduce the additional processing flow.

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-process).

#### plugin `ModelDefine`

We use the type of plugin to choose which model you want to use to complete the corresponding machine learning task.

- for a text classifier, then we can choose the [`bayesian-model-define`](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define/bayesian-model-define) plugin.
- for an image classification task, you can choose the [`tensorflow-resnet-model-define`](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define/tensorflow-resnet-model-define) based on tensorflow.

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define).

#### plugin `ModelLoad`

Sometimes, developers want to load a trained model directly in Pipeline. At this time, we can use `ModelLoad` plugin. So far, Pipcook has provided the following loaders:

- [`@pipcook/plugins-tensorflow-model-load`][] is to load the tensorflow saved model.

#### plugin `ModelTrain`

The type of plugin is used to train the model, usually defined after `ModelDefine` and `DataAccess`, and then input the data in the training set into the model for training. Developers need to select the corresponding training plugin according to the task data type (image or text) and framework(tensorflow or naive bayes).

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-train).

#### plugin `ModelEvaluate`

It corresponds to `ModelTrain`, except that the `ModelEvaluate` plugin uses the testing set to evaluate the model. When selecting a `ModelEvaluate` plugin, it is also selected according to the data type and machine learning framework of the task.

> Available plugins is [here](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-evaluate).

[`DataLoader`]: https://github.com/alibaba/pipcook/blob/master/packages/core/src/types/data/common.ts
[`@pipcook/plugins-tensorflow-model-load`]: https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-load/tensorflow-model-load
