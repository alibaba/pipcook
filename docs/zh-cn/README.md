# Pipcook

[Pipcook][] 项目是一个开源工具包，它能让 Web 开发者更好地使用机器学习，从而开启和加速前端智能化时代！

## 为什么要开发 Pipcook

它旨在使 Web 工程师能够在零门槛的前提下使用机器学习，并拥有将前端技术领域带到智能领域的视角。[Pipcook][] 的目标就是成为机器学习和前端交互的跨领域工具包。

我们将完全基于前端应用程序来设计 Pipcook API，并专注于前端领域，以真实解决 Web 工程师使用机器学习的痛点来开发 Pipcook。以面向 Web 友好为原则，来推动机器学习工程和前端工程师的融合。

## 简单的介绍

[Pipcook][] 项目提供了一些工具包组件，包括机器学习工作流框架，命令行管理工具，机器学习的 JavaScript 运行时。你也可以在其他项目中使用这些工具或框架来搭建你所需要的系统。

### 设计原则

在 [Pipcook][] 中，我们遵循一些基本的设计原则，来保证整个软件是模块化和灵活的，这些原则也能帮助社区来对 [Pipcook][] 未来的方向作出指导。

- **模块化** 项目中包含了大量的组件，每一个组件都必须保证是良好定义的。
- **可更换** 项目中包含了足够的组件来构建现在的 Pipcook，不过我们通过模块化的架构和规范，开发者可以按照自己的需要对部分组件切换为其他的实现方式。

### 受众

[Pipcook][] 面向以下的 Web 工程师：

- 想要学习机器学习
- 想要训练和部署自己的模型
- 想要优化模型的性能，比如针对一个图片分类模型，有一个更高的准确度

> 如果你满足上面条件之一，那么就尝试从[安装](INSTALL.md)开始吧。

### 组件

__Pipcook Pipeline__

它用于表达机器学习的工作流，其中包含了 Pipcook 插件，在这一层，我们需要保证整个系统的稳定性和拓展性，同时使用插件机制来支持丰富的数据集、训练、验证和部署。

一条 Pipcook Pipeline 由多个插件组成，通过配置不同的插件以及参数，最终会输出一个 NPM 包，其中包含了训练好的模型和 JavaScript 函数，你就可以像使用普通 NPM 包一样使用你训练好的模型了。

> 注意：在 Pipcook 中，每一个 Pipeline 仅拥有一个角色，那就是训练一个用户需要的模型，也就是说每一个 Pipeline 的最后一个节点都必须输出一个训练好的模型，否则这个 Pipeline 就是非法的。

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
