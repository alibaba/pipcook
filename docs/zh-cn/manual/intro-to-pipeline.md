# Pipeline

在 Pipcook 中，我们使用 Pipeline 来表示一个模型的训练工作流，那么这个 Pipeline 到底是什么样的呢？在 Pipeline 中，开发者能够使用 JSON 来描述从样本收集、模型定义、模型训练和模型评估这些阶段。

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

如上面文件所示，一个 Pipeline 由不同的插件组成，然后我们为每个插件添加了 `params` 字段来传递不同的参数。接着，Pipeline 解释器就会根据这个 JSON 文件中定义的插件和参数，来执行不同的操作。

> 如果想获取更多插件相关的知识，可以阅读[插件使用手册](./intro-to-plugin.md)。

下一步，我们在定义好一个 Pipeline 文件后，就能通过 Pipcook 来运行它了。

## 准备工作

通过[命令行工具配置指南](./pipcook-tools.md#环境设置)来做运行 Pipeline 前的准备。

## 运行

将上面的 Pipeline 保存在任何地方，然后执行：

```sh
$ pipcook run /path/to/your/pipeline-config.json
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

通过下面的脚本即可使用你训练的脚本了：

```js
import * as predict from './output';
predict('your input data');
```
