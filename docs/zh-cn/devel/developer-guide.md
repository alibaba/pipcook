# 开发者手册

## 代码仓库

我们全部的代码将会开源并托管在我们的 GitHub 仓库中，这里是我们仓库的[地址](https://github.com/alibaba/pipcook)


## 环境搭建

- 操作系统：支持 MacOs, Linux
- 运行环境：Node.js >= 10.16， Npm >= 6.1.0
- python要求 （python >= 3.6, pip 指向正确的 python3 路径
- 全局 npm 包: lerna, typescript compiler

想要查看是否正确安装上述环境，可以使用如下命令查看

```sh
$ node -v
$ npm -v
$ tsc -v
$ lerna -v
$ python --version
$ pip --version
```

## 插件开发规范

可以点击[这里](/zh-cn/spec/plugin.md)查看插件规范文档。

我们为每个插件定义了一套接口，每个类型的插件需要严格按照接口实现，详细信息如下：

- [Data Collect](/zh-cn/spec/plugin/0-data-collect.md)
- [Data Access](/zh-cn/spec/plugin/1-data-access.md)
- [Data Process](/zh-cn/spec/plugin/2-data-process.md)
- [Model Load](/zh-cn/spec/plugin/3-model-define.md)
- [Model Train](/zh-cn/spec/plugin/4-model-train.md)
- [Model Evaluate](/zh-cn/spec/plugin/5-model-evaluate.md)
- [Model Deploy](/zh-cn/spec/plugin/6-model-deploy.md)

## 数据集规范

开发时涉及到数据读取处理请参考我们的[数据集规范](/zh-cn/spec/dataset.md)。
