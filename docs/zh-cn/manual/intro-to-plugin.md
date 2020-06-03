# 插件

在 Pipcook 中，每一个 Pipeline 表示一个特定的机器学习任务，那么我们如何定义一个工作流呢？Pipcook 使用插件来定义和配置 Pipeline 中不同的阶段，比如一个文本分类的任务，就可以用下面的插件来组成：

- `@pipcook/plugins-csv-data-collect` 通过 `DataCollect` 插件来下载数据集。
- `@pipcook/plugins-csv-data-access` 将下载的数据集格式转换为后面模型能够接受的格式。
- `@pipcook/plugins-bayesian-model-define` 定义文本分类的模型，[朴素贝叶斯分类器](https://en.wikipedia.org/wiki/Naive_Bayes_classifier)。
- `@pipcook/plugins-bayesian-model-train` 输入训练集到模型中训练。
- `@pipcook/plugins-bayesian-model-evaluate` 输入测试集，做模型准确度评估。

> 上述 Pipeline 的源码定义在[这里](https://github.com/alibaba/pipcook/blob/master/example/pipelines/text-bayes-classification.json)。

通过上面的例子，我们可以对于一个文本分类器的任务，我们遵循机器学习工作流，它按照不同类型的子任务顺序执行，而每个子任务就对应一个用户定义的插件，同时用户也可以以较低成本，快速地调整整个任务的 Pipeline。

接着，我们来看看都有哪些类型的插件。

#### `DataCollect` 插件

它用于将不同类型的数据集收集到 Pipeline 中，通常需要定义诸如 `datasetUrl` 之类的参数来获取数据源。为了方便以下插件的方便实现，我们根据文本和图像定义了 `DataCollect` 的统一输出：

- 对于文本类任务，使用 CSV 格式作为输出格式。
- 对于图片类任务，使用 [coco dataset](http://cocodataset.org/) 作为输出格式。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-collect)。

#### `DataAccess` 插件

它用于将数据集转换为之后模型所需的格式，并将数据加载到相应的数据集 [`DataLoader`][] 中。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-access)。

#### `DataProcess` 插件

它通常在 DataAccess 之后使用，用于在训练之前对 [`DataLoader`][] 中的数据进行一些预处理。此外，在模型训练完成，Pipcook 将使用配置好的  DataProcess 插件在预测之前对输入数据进行预处理，从而减少了额外的处理流程。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/data-process)。

#### `ModelDefine` 插件

我们使用 ModelDefine 来选择您要使用哪种模型来完成相应的机器学习任务。

- 对于文本分类任务, 可以选择 [`bayesian-model-define`](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define/bayesian-model-define) 来完成。
- 对于图片分类任务, 可以选择 [`tensorflow-resnet-model-define`](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define/tensorflow-resnet-model-define) 来完成。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-define)。

#### `ModelLoad` 插件

在一些场景，开发者希望直接在 Pipeline 中加载预训练模型，为此，可以使用 `ModelLoad` 插件。 Pipcook提供了以下的插件用于支持不同的模型框架：

- [`@pipcook/plugins-tensorflow-model-load`][] 用于加载 TensorFlow 的 SavedModel。

#### `ModelTrain` 插件

这类插件用于训练模型，通常在 ModelDefine 和 DataAccess 之后定义，然后将训练集中的数据输入到模型中进行训练。开发人员需要根据任务的数据类型（图像或文本）和框架（TensorFlow）选择相应的训练插件。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-train)。

#### `ModelEvaluate` 插件

与 ModelTrain 类似，ModelEvaluate 插件使用测试集评估训练好的模型。选择 ModelEvaluate 插件时，也需要根据任务的数据类型和框架进行选择。

> 可用的官方插件在[这里](https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-evaluate)。

[`DataLoader`]: https://github.com/alibaba/pipcook/blob/master/packages/core/src/types/data/common.ts
[`@pipcook/plugins-tensorflow-model-load`]: https://github.com/alibaba/pipcook/tree/master/packages/plugins/model-load/tensorflow-model-load
