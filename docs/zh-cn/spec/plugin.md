# 插件规范

[Pipcook][] 使用插件来完成特定机器学习任务的任务，它使得框架足够简单、稳定和高效。

同时，通过定义了不同的插件规范，使得我们可以允许任何人开发插件来拓展 [Pipcook][]，理论上，我们可以通过插件来完成任何的机器学习任务。

## 包结构

[Pipcook][] 使用 NPM 作为插件包的基础。另外，我们在 NPM 的 package.json 中拓展了属于 [Pipcook Plugin][] 的协议。

```json
{
  "name": "my-own-pipcook-plugin",
  "version": "1.0.0",
  "description": "my own pipcook plugin",
  "dependencies": {
    "@pipcook/pipcook-core": "^0.5.0"
  },
  "pipcook": {
    "category": "dataCollect",
    "datatype": "image"
  },
  "conda": {
    "python": "3.7",
    "dependencies": {
      "tensorflow": "2.2.0"
    }
  }
}
```

通过上面的 `package.json` 定义，有一些 Pipcook 的要求：

- 插件包必须使用 TypeScript，并且需要在发布前编译成 JavaScript。
- 需要添加依赖 `@pipcook/pipcook-core`，它包含了创建插件所需的类型定义和工具类。
- 需要添加一个根节点 `pipcook`，
  - `pipcook.category` 用于描述插件类型，所有的类型可以看[这里](#分类)。
  - `pipcook.datatype` 用于描述插件所处理的数据类型，目前支持：`common`、`image` 和 `text`。
- 可选的节点 `conda`，用于配置 Python 相关的依赖，
  - `conda.python` 用于声明 Python 版本，目前必须是 3.7。
  - `conda.dependencies` 用于声明插件会使用到的 Python 包，Pipcook 会在初始化插件时进行安装，它支持以下的版本声明方式：
    - `x.y.z` [PyPI][] 的确定版本。
    - `*` [PyPI][] 的最新版本。
    - `git+https://github.com/foobar/project@master` 从 GitHub 仓库安装，参考 [pip-install(1)](https://pip.pypa.io/en/stable/reference/pip_install/#git)。

## 分类

下面是所有在 Pipcook 中支持的插件分类。

- [`dataCollect(args: ArgsType): Promise<void>`][] 从数据源中下载数据，并且存储为统一的格式。
- [`dataAccess(args: ArgsType): Promise<UniDataset>`][] 将数据加载到加载器中，兼容之后的模型插件。
- [`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<void>`][] 按行进行数据预处理。
- [`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`][] 加载预训练模型。
- [`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`][] 定义模型。
- [`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`][] 输出训练后的模型，以及模型持久化。
- [`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`][] 调用对应的模型评估函数，评估训练后的模型。

## 开发

查看[贡献者文档](../contributing/contribute-a-plugin.md)来学习如何开发一个新的插件。

[Pipcook]: https://github.com/alibaba/pipcook
[Pipcook Plugin]: ../GLOSSORY.md#pipcook-plugin
[PyPI]: https://pypi.org

[`dataCollect(args: ArgsType): Promise<void>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/datacollecttype.html
[`dataAccess(args: ArgsType): Promise<UniDataset>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataaccesstype.html
[`dataProcess(sample: Sample, md: Metadata, args: ArgsType): Promise<void>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/dataprocesstype.html
[`modelLoad(data: UniDataset, args: ArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelloadtype.html
[`modelDefine(data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeldefinetype.html
[`modelTrain(data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modeltraintype.html
[`modelEvaluate(data: UniDataset, model: UniModel): Promise<EvaluateResult>`]: https://alibaba.github.io/pipcook/typedoc/interfaces/modelevaluatetype.html
