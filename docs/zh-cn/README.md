# Pipcook

[Pipcook][] 项目是一个开源工具集，它能让 Web 开发者更好地使用机器学习，从而开启和加速前端智能化时代！

## 用法
使用 Pipcook 进行机器学习开发非常简单，只需 4 步：安装、训练、预测、部署。

安装 Pipcook-cli:

```sh
$ npm install -g @pipcook/cli
```

选择一个[内置 pipeline](https://github.com/alibaba/pipcook/tree/main/example/pipelines) 进行训练，比如图片分类：

```sh
$ pipcook train https://cdn.jsdelivr.net/gh/alibaba/pipcook@main/example/pipelines/image-classification-mobilenet.json -o output
```

使用训练结果进行预测：

```sh
$ pipcook predict ./output/image-classification-mobilenet.json -s ./output/data/test/blurBackground/4572_58__1500.94_453.jpg
Origin result:[{"id":1,"category":"blurBackground","score":1}]
```

预测的结果显示当前输入的图片分类为 `blurBackground`，可信度为 1。

部署服务:

```sh
$ pipcook predict ./output/image-classification-mobilen
ℹ preparing framework
ℹ preparing scripts
ℹ preparing artifact plugins
ℹ initializing framework packages
Pipcook has served at: http://localhost:9091
```

接下来，打开浏览器并访问 `http://localhost:9091` 就可以访问到你的图片分类任务了。

## 为什么要开发 Pipcook

它旨在使 Web 工程师能够在零门槛的前提下使用机器学习，并拥有将前端技术领域带到智能领域的视角。[Pipcook][] 的目标就是成为机器学习和前端交互的跨领域工具包。

我们将完全基于前端应用程序来设计 Pipcook API，并专注于前端领域，以真实解决 Web 工程师使用机器学习的痛点来开发 Pipcook。以面向 Web 友好为原则，来推动机器学习工程和前端工程师的融合。

## 简单的介绍

[Pipcook][] 项目提供了若干独立的子项目，包括机器学习工作流框架，命令行管理工具，机器学习的 JavaScript 运行时。你也可以在其他项目中使用这些框架来搭建你所需要的系统。

### 设计原则

在 [Pipcook][] 中，我们遵循一些基本的设计原则，来保证整个软件是模块化和灵活的，这些原则也能帮助社区来对 [Pipcook][] 未来的方向作出指导。

- **模块化** 项目中包含了一些子项目，它们自身都必须保证是良好定义的。
- **可更换** 项目中包含了足够的模块来构建现在的 Pipcook，不过我们通过模块化的架构和规范，开发者可以按照自己的需要对部分模块切换为其他的实现方式。

### 受众

[Pipcook][] 面向以下的 Web 工程师：

- 想要学习机器学习
- 想要训练和部署自己的模型
- 想要优化模型的性能，比如针对一个图片分类模型，有一个更高的准确度

> 如果你满足上面条件之一，那么就尝试从[安装](INSTALL.md)开始吧。

### 子项目

__Pipcook Pipeline__

它用于表达机器学习的工作流，其中包含了 Pipcook Script，在这一层，我们需要保证整个系统的稳定性和拓展性，同时使用[Script](manual/intro-to-script.md)机制来支持丰富的数据源、数据流、训练和验证。

一条 Pipcook Pipeline 由多个 script 组成，通过配置不同的插件以及参数，最终会输出一个目录，其中包含了训练好的模型。

__Pipcook Bridge to Python__

对于 JavaScript 工程师来说，开始机器学习最苦难的一点就是缺乏一套成熟的工具集。在 Pipcook，我们提供了 **Boa**，它使用 N-API 将 [CPython][] 集成在了 Node.js 环境，从而让开发者能够通过 JavaScript 访问到 Python 生态来解决这个痛点。

通过它，开发者可以毫无顾虑地在 Node.js 中使用诸如 `numpy`、`scikit-learn`、`jieba` 或 `tensorflow` 这样的 Python 包。

## 下一步

看到这里，已经按耐不住想要使用 [Pipcook][] 了吗？可以按照下面的介绍开始你下一步的学习之旅：

- [如何安装](INSTALL.md)
- [什么是机器学习](tutorials/machine-learning-overview.md)
- [如何使用 Pipeline](manual/intro-to-pipeline.md)
- [如何使用 Boa](manual/intro-to-boa.md)
- [如何使用 Pipcook Tools](manual/pipcook-tools.md)

[Pipcook]: https://github.com/alibaba/pipcook
[CPython]: https://github.com/python/cpython
