# Pipcook Tools

Pipcook Tools 是 Pipcook 提供给开发者使用的命令行工具，它帮助开发者管理本地的 Pipeline 和插件，以及也允许你定义、训练和优化模型。

## 安装

```sh
$ npm install @pipcook/pipcook-cli -g
```

查看[安装指南](../INSTALL.md)查看完成的安装引导。

## 环境设置

当 Pipcook Tools 完成后，还需要执行一些初始化指令，它会帮助下载 [Pipcook Daemon][] 和 [Pipboard][]，最后还需要手动启动 [Pipcook Daemon][]：

```sh
$ pipcook init
$ pipcook daemon start
```

可以使用 [tuna mirror](https://mirrors.tuna.tsinghua.edu.cn/) 来加速你的 Python 安装：

```sh
$ pipcook init --tuna
```

执行完上述的初始化命令，以及启动 [Pipcook Daemon][] 后，你就可以开始使用 Pipcook 了，让我们从一些简单的命令开始吧。

## 使用指南

从本地运行一个 Pipeline，只需要执行如下命令：

```sh
$ pipcook run path/to/your/pipeline-config.json
```

> 关于如何编写 pipeline, 可以看[这里](./intro-to-pipeline.md).

在上面的例子中，每一次命令都会创建一个新的 Pipeline，这种方式并不是特别方便我们对同一个 Pipeline 做迭代演进和可视化，因此我们可以使用 `pipcook-job(1)` 子命令：

```sh
$ pipcook job run <pipeline id>
```

上面的命令会从已经存在的一个 Pipeline 来创建任务，这样就可以避免重复的创建 Pipeline 了，那么接下来，如何在不运行的情况下，创建 Pipeline 呢？

```sh
$ pipcook pipeline create path/to/your/pipeline-config.json
```

创建完成后，通过 `list` 来查看所有的 Pipeline：

```sh
$ pipcook pipeline list
┌─────────┬────────────────────────────────────────┬──────┬────────────────────────────┬────────────────────────────┐
│ (index) │                   id                   │ name │         updatedAt          │         createdAt          │
├─────────┼────────────────────────────────────────┼──────┼────────────────────────────┼────────────────────────────┤
│    0    │ 'c0432b50-a1ed-11ea-9209-9723e386c9d5' │ null │ '2020-05-29T20:48:29.318Z' │ '2020-05-29T20:48:29.318Z' │
│    1    │ '94aa20c0-a1ed-11ea-a602-6d2f8632b52c' │ null │ '2020-05-29T20:47:16.172Z' │ '2020-05-29T20:47:16.172Z' │
│    2    │ '9c485630-a1cf-11ea-a602-6d2f8632b52c' │ null │ '2020-05-29T17:12:44.052Z' │ '2020-05-29T17:12:44.052Z' │
└─────────┴────────────────────────────────────────┴──────┴────────────────────────────┴────────────────────────────┘
```

通过 `info` 可以看到某个 Pipeline 的 JSON 表示：

```sh
$ pipcook pipeline info <id>
{
  "plugins": {
    "dataCollect": {
      "name": "./packages/plugins/data-collect/object-detection-coco-data-collect",
      "params": {
        "url": "http://foobar"
      }
    },
    "dataAccess": {
      "name": "./packages/plugins/data-access/coco-data-access",
      "params": {}
    },
    "modelDefine": {
      "name": "./packages/plugins/model-define/detectron-fasterrcnn-model-define",
      "params": {}
    },
    "modelTrain": {
      "name": "./packages/plugins/model-train/object-detection-detectron-model-train",
      "params": {
        "steps": 1
      }
    },
    "modelEvaluate": {
      "name": "./packages/plugins/model-evaluate/object-detection-detectron-model-evaluate",
      "params": {}
    }
  }
}
```

## 插件管理

通过 `pipcook-pipeline(1)` 创建 Pipeline 时，如果发现插件没有安装的话，Pipcook 会自动安装到用户目录，除此之外，你也可以通过 `pipcook-plugin(1)` 手动管理。

首先，通过 `list` 来查看所有已经安装的插件：

```sh
$ pipcook plugin list
┌─────────┬───────────────────────────────────────────────────────────────────┬──────────┬─────────────────┬──────────┐
│ (index) │                               name                                │ version  │    category     │ datatype │
├─────────┼───────────────────────────────────────────────────────────────────┼──────────┼─────────────────┼──────────┤
│    0    │                '@pipcook/plugins-csv-data-access'                 │ '0.5.9'  │  'dataAccess'   │  'text'  │
│    1    │              '@pipcook/plugins-bayesian-model-train'              │ '0.5.10' │  'modelTrain'   │  'text'  │
│    2    │            '@pipcook/plugins-bayesian-model-evaluate'             │ '0.5.10' │ 'modelEvaluate' │  'text'  │
│    3    │                '@pipcook/plugins-csv-data-collect'                │ '0.5.9'  │  'dataCollect'  │  'text'  │
│    4    │             '@pipcook/plugins-bayesian-model-define'              │ '0.5.10' │  'modelDefine'  │  'text'  │
│    5    │               '@pipcook/plugins-mnist-data-collect'               │ '0.5.9'  │  'dataCollect'  │ 'image'  │
└─────────┴───────────────────────────────────────────────────────────────────┴──────────┴─────────────────┴──────────┘
```

卸载插件：

```sh
$ pipcook plugin uninstall @pipcook/plugins-csv-data-access
```

从 NPM 安装插件：

```sh
$ pipcook plugin install @pipcook/plugins-csv-data-access
```

从本地安装插件

```sh
$ pipcook plugin install /path/to/dir/of/your/plugin
```

从 Git 安装

```sh
$ pipcook plugin install git+ssh://git@some.git.com/my-git-repo.git
```

注意：在安装插件时，必须保证安装的插件符合 Pipcook 插件规范。

## 服务管理

[Pipcook Daemon][] 是一个后台服务进程，它帮助用户真正地管理插件和 Pipeline，那么怎么通过命令行来管理这个服务呢？

启动/重启服务：

```sh
$ pipcook daemon start
$ pipcook daemon restart
```

停止服务：

```sh
$ pipcook daemon stop
```

[Pipcook Daemon]: ../GLOSSORY.md#pipcook-daemon
[Pipboard]: ../GLOSSORY.md#pipboard
