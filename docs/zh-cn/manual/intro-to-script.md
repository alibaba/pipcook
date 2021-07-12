# Pipcook 脚本

在 Pipcook 中，每一个 Pipeline 表示一个特定的机器学习任务，那么我们如何定义一个工作流呢？Pipcook 使用脚本来定义和配置 Pipeline 中不同的阶段。Pipcook 脚本是一个暴露了特定方法的 js 脚本文件，包含 3 种不同的类型，分别为 datasource，dataflow 和 model，具体的定义看[这里](../spec/script.md)。比如一个文本分类的任务，就可以用下面的脚本来组成：

- `datasource` 通过 datasource 脚本来下载样本数据，提供数据访问接口。
- `dataflow` 将下载的数据集格式转换为后面模型能够接受的格式（在此例中不需要）。
- `model` 定义文本分类的模型，[朴素贝叶斯分类器](https://en.wikipedia.org/wiki/Naive_Bayes_classifier)，通过样本数据接口获取样本进行模型训练，并评估准确度。

> 上述 Pipeline 的源码定义在[这里](https://github.com/alibaba/pipcook/blob/main/example/pipelines/bayes.v2.json)。

通过上面的例子，对于一个文本分类器的任务，我们遵循机器学习工作流，它按照不同类型的子任务顺序执行，而每个子任务就对应一个用户定义的插件，同时用户也可以以较低成本，快速地调整整个任务的 Pipeline。

> 可用的官方脚本在[这里](https://github.com/imgcook/pipcook-script)。
