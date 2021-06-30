# Pipeline

在 Pipcook 中，我们使用 Pipeline 来表示一个模型的训练工作流，那么这个 Pipeline 到底是什么样的呢？在 Pipeline 中，开发者能够使用 JSON 来描述从样本收集、模型定义、模型训练和模型评估这些阶段。

```js
{
  "specVersion": "2.0",
  "dataSource": "http://host/data-source-script.js?url=http://host/dataset.zip",
  "dataflow": [
    "http://host/dataflow-resize-script.js?size=224&size=224"
  ],
  "model": "http://host/model-script.js",
  "artifacts": [{
    "processor": "pipcook-artifact-zip@0.0.2",
    "target": "/home/pipcook/mobilenet-model.zip"
  }],
  "options": {
    "framework": "mobilenet@1.0.0",
    "train": {
      "epochs": 10,
      "validationRequired": true
    }
  }
}
```

如上面文件所示，一个 Pipeline 由不同的插件组成，然后我们为每个插件添加了 `params` 字段来传递不同的参数。接着，Pipeline 解释器就会根据这个 JSON 文件中定义的插件和参数，来执行不同的操作。

> 如果想获取更多插件相关的知识，可以阅读[插件使用手册](./intro-to-plugin.md)。

下一步，我们在定义好一个 Pipeline 文件后，就能通过 Pipcook 来运行它了。

## 准备工作

通过[命令行工具配置指南](./pipcook-tools.md#环境设置)来做运行 Pipeline 前的准备。

## 运行

将上面的 Pipeline 保存在任何地方，然后执行：

```sh
$ pipcook run /path/to/your/pipeline-config.json --tuna
```

执行完成后，训练好的模型会生成在当前[工作目录](https://linux.die.net/man/3/cwd)下的 `output` 中。

```
📂output
   ┣ 📂logs
   ┣ 📂model
   ┣ 📜package.json
   ┣ 📜metadata.json
   ┗ 📜index.js
```

为了使用训练好的模型，还需要完成以下步骤：

```sh
$ npm install
```

上述的命令会帮助你安装依赖，它们包括插件以及插件所依赖的 Python 包。Pipcook 也提供了一条命令，来使用 [tuna](https://mirrors.tuna.tsinghua.edu.cn/) 镜像来下载 Python 包：

```sh
$ BOA_TUNA=1 npm install
```

当 `output` 初始化完成，就可以使用 `import` 来导入你的模型了：

```js
import * as predict from './output';
predict('your input data');
```
