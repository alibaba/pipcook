# 新手入门

本文将从实例的角度出发，带您快速训练一个机器学习模型。

## 环境准备

- 操作系统：支持 MacOs, Linux
- 运行环境：Node.js >= 10.16， Npm >= 6.1.0
- Python：>=3.6

我们强烈建议您直接使用我们的 docker 镜像，以确保 Pipcook 的运行环境正确。

## 环境初始化和快速体验

### 本地方式

首先安装 Pipcook 脚手架 pipcook-cli, 此工具将提供环境初始化，控制流程开始与结束，日志查看等功能。

```sh
$ npm install -g @pipcook/pipcook-cli
```

安装好脚手架之后，可以创建工程文件夹 (或者集成进现有的任何前端项目)，然后使用脚手架简单的几条指令快速生成项目

```sh
$ mkdir pipcook-example && cd pipcook-example
$ pipcook init
```

> 如果你使用国内的 npm 客户端，如 cnpm，那么您可以使用 `pipcook init -c cnpm` 来初始化。

此时，Pipcook 所有需要的相关的环境已经安装完毕，此外，还会为您生成一些 Pipcook 工程的样例文件<br />例如，您可以快速进行一次图片分类识别，想要开始这个训练，您只需要一个简单的命令

```sh
$ pipcook run examples/mnist-image-classification.json
```