# Pipeline

在 Pipcook 中，我们使用 Pipeline 来表示一个模型的训练工作流，那么这个 Pipeline 到底是什么样的呢？在 Pipeline 中，开发者能够使用 JSON 来描述从样本收集、模型定义、模型训练和模型评估这些阶段。

```js
{
  "specVersion": "2.0",
  "type": "ImageClassification",
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@4b3d60c/scripts/image-classification-mobilenet/build/datasource.js?url=http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/imageclass-test.zip",
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@4b3d60c/scripts/image-classification-mobilenet/build/dataflow.js?size=224&size=224"
  ],
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@4b3d60c/scripts/image-classification-mobilenet/build/model.js",
  "artifact": [{
    "processor": "pipcook-artifact-zip@0.0.2",
    "target": "/tmp/mobilenet-model.zip"
  }],
  "options": {
    "framework": "tfjs@3.8",
    "train": {
      "epochs": 20,
      "validationRequired": true
    }
  }
}
```

如上面 JSON 所示，一个 Pipeline 由 `dataSource`, `dataflow` 和 `model` 这三类 Script 以及 构建插件 `artifacts`, Pipeline 选项 `options` 组成。
每个 Script 通过 URI query 传递参数，model script 的参数也可以通过 `options.train` 定义。
`artifacts` 定义了一组构建插件，每个构建插件会在训练结束后被依次调用，从而可以对输出的模型进行转换、打包、部署等。
`options` 包含框架定义和训练参数的定义。
接着，Pipcook 就会根据这个 JSON 文件中定义的 URI 和参数，来准备环境，运行 Script，最后输出和处理模型。

> Pipeline 中的脚本支持 `http`，`https` 和 `file` 协议。

> 如果想获取更多 Script 相关的知识，可以阅读[如何编写 Pipcook Script](./intro-to-script.md)。

下一步，我们在定义好一个 Pipeline 文件后，就能通过 Pipcook 来运行它了。

## 准备工作

通过[命令行工具安装指南](./pipcook-tools.md#环境设置)来做运行 Pipeline 前的准备。

## 运行

将上面的 Pipeline 保存在磁盘上，然后执行：

```sh
$ pipcook run /path/to/your/pipeline-config.json
```

或者 serve 在静态资源服务器上：

```sh
$ pipcook run https://host/path/to/your/pipeline-config.json
```

执行完成后，训练好的模型会生成在当前[工作目录](https://linux.die.net/man/3/cwd)下，以当前时间戳命名的文件夹中，同时模型文件会被构建插件 `pipcook-artifact-zip` 压缩成 zip 文件并保存在 tmp 目录下。

```
  ├── pipeline-config.json
  ├── cache
  ├── data
  ├── framework
  ├── model
  └── scripts
```

model 目录下保存了模型文件，在后续的版本迭代中，会增加模型使用的能力。
