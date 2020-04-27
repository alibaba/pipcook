# Pipcook

为 JavaScript 开发者提供的机器学习工具集。

<a href="https://github.com/alibaba/pipcook/actions">
  <img alt="Github Action Build" src="https://github.com/alibaba/pipcook/workflows/build/badge.svg?branch=master&event=push"></a>
<a href="https://hub.docker.com/r/pipcook/pipcook">
  <img alt="Docker Cloud Build Status" src="https://img.shields.io/docker/cloud/build/pipcook/pipcook"></a>

## 为什么开发 Pipcook

Pipcook 以前端工程师零门槛应用机器学习能力为使命，以引领前端技术领域走向智能化为愿景,  发展成为了从处理数据、训练模型到服务部署的一站式前端算法工程平台。Pipcook 将专注在前端领域，始终秉持着站在前端工程师视角开发，对前端工程师友好的原则，最终推动装上机器学习引擎的前端行业向前发展。

Pipcook API 完全是以开发前端机器学习应用而设计，我们聚焦于前端领域，并以前端工程师视角为根本，通过构建一套面向 JavaScript 友好的机器学习工具集，将前端领域不断推向智能化的时代。

## 什么是 Pipcook

Pipcook 被分为以下3个层次。

__Pipcook Application__

通过定义灵活、直观的 API，帮助开发者轻松构建机器学习应用，并且无需了解任何算法和底层细节。

__Pipcook Core__

它用于描述机器学习流水线（ML Pipelines），每个流水线的节点又一个插件构成。Pipecook 通过流水线机制来保证整个流程的稳定和可拓展性，并且通过插件来支持丰富的功能，包括：数据集、训练、验证和部署。

__Pipcook Bridge to Python__

对于 JavaScript 工程师来说，智能化最困难之处在于，生态中缺乏成熟的机器学习工具套件。为此，我们通过桥接的方式，打通 Python 与 Node.js 的世界，为 JavaScript 引入一些 Python 生态中成熟的工具和接口，以弥补 JavaScript 生态中的缺失。

## 工作原理

Pipcook 的核心是一条流水线（Pipeline）， 在这个流水线中，将会有一系列插件嵌入，每个插件负责机器学习生命周期特定的环节。每个插件的输入和输出的数据将会在这个流水线中流通。Pipcook 基于 Rxjs 的响应式框架，负责对 pipeline 中的数据进行响应、调度和管理。Pipcook 的这条 pipeline 如下图所示：

![](https://camo.githubusercontent.com/3218a0e51ae58a09f4093fcbce153a4c46b6e248/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323031392f706e672f3635343031342f313537353839373437343630352d32653561333861642d303630642d346330382d616238332d3262346661646639373361382e706e6723616c69676e3d6c65667426646973706c61793d696e6c696e65266865696768743d343835266e616d653d696d6167652e706e67266f726967696e4865696768743d393639266f726967696e57696474683d323332332673697a653d333230363838267374617475733d646f6e65267374796c653d6e6f6e652677696474683d313136312e35#align=left&display=inline&height=969&originHeight=969&originWidth=2323&status=done&style=none&width=2323)

我们的插件机制有很高的可扩展性，遵循着一个插件只做一件事情的原则，Pipcook 通过串联起这些插件来实现一个机器学习工程链路。同时，对于用户来讲，用户只需调用一些简单的 API，即可指定所需要的插件，搭建起一个项目来。

### 基本概念

- **Runner** Pipcook 核心调度，我们将所有 component 传入给 runner 启动 pipcook 工程；
- **Pipeline** Pipcook 的插件插入到 pipeline 中，pipeline 中流通数据和模型，每个插件会拦截这些数据做处理，然后再释放数据；
- **Plugin** 插件，我们将提供内置插件, 同时支持第三方插件，每个插件负责做一件事，负责具体的一项机器学习生命周期中的任务；
- **Component** 是由 Pipcook 提供，负责解析插件内容，用户在使用的时候需要将 plugin 传入到 component 当中解析；

## 快速开始

是否已经迫不及待开始一个 Pipcook 工程?，请[参考这里来快速开始](tutorials/get-started.md)一个工程吧


## 进阶

在亲手搭建了一个机器学习项目之后，您是否想了解 Pipcook 的更多信息，您可以查看以下链接了解更多

- 新手教程
  - [新手入门——命令行工具](./tutorials/get-started-with-cli.md)
  - [如何开发一个插件](./tutorials/how-to-develop-a-plugin.md)
  - [Boa 文档 (如何在 node.js 中使用 Python)](./tutorials/want-to-use-python.md)

- 开发者
  - [开发者指南](./devel/developer-guide.md)

- 规范
  - [插件规范](./spec/plugin.md)
  - [数据集规范](./spec/dataset.md)

- [API](/typedoc) (only available on website)
