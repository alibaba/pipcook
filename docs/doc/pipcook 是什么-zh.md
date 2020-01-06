# pipcook 是什么

Pipcook 以前端工程师 0 门槛应用机器学习能力为使命，以引领前端技术领域走向智能化为愿景,  发展成为了从处理数据、训练模型到服务部署的一站式前端算法工程平台。Pipcook 将专注在前端领域，始终秉持着站在前端工程师视角开发，对前端工程师友好的原则，最终推动装上机器学习引擎的前端行业向前发展。
<a name="xADj0"></a>
### 工作原理

---

Pipcook 的核心是一条 pipeline， 在这个 pipeline 中，将会有一系列插件嵌入，每个插件负责机器学习生命周期特定的环节。每个插件的输入和输出的数据将会在这个 pipeline 中流通。Pipcook 基于 Rxjs 的响应式框架，负责对 pipeline 中的数据进行响应、调度和管理。Pipcook 的这条 pipeline 如下图所示：<br />![](https://camo.githubusercontent.com/3218a0e51ae58a09f4093fcbce153a4c46b6e248/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323031392f706e672f3635343031342f313537353839373437343630352d32653561333861642d303630642d346330382d616238332d3262346661646639373361382e706e6723616c69676e3d6c65667426646973706c61793d696e6c696e65266865696768743d343835266e616d653d696d6167652e706e67266f726967696e4865696768743d393639266f726967696e57696474683d323332332673697a653d333230363838267374617475733d646f6e65267374796c653d6e6f6e652677696474683d313136312e35#align=left&display=inline&height=969&originHeight=969&originWidth=2323&status=done&style=none&width=2323)<br />我们的插件机制有很高的可扩展性，遵循着一个插件只做一件事情的原则，pipcook 通过串联起这些插件来实现一个机器学习工程链路。同时，对于用户来讲，用户只需调用一些简单的 API，即可指定所需要的插件，搭建起一个项目来。
<a name="kyM3v"></a>
### 快速开始

---

是否已经迫不及待开始一个 pipcook 工程?，请[参考这里来快速开始](https://alibaba.github.io/pipcook/doc/快速入门-zh)一个工程吧

<a name="3yV7x"></a>
### 概念

---

- plugin：pipcook 插件，我们将提供内置插件, 同时支持第三方插件，每个插件负责做一件事，负责具体的一项机器学习生命周期中的任务
- component：component 由 pipcook 提供，负责解析插件内容，用户在使用的时候需要将 plugin 传入到 component 当中解析
- pipeline： pipcook 的插件插入到 pipeline 中，pipeline 中流通数据和模型，每个插件会拦截这些数据做处理，然后再释放数据
- runner： pipcook 核心调度，我们将所有 component 传入给 runner 启动 pipcook 工程
<a name="7sEAi"></a>
### 进阶

---

在亲手搭建了一个机器学习项目之后，您是否想了解 pipcook 的更多信息，您可以查看以下链接了解更多

- [了解更多关于插件的信息](https://alibaba.github.io/pipcook/doc/插件介绍-zh)
- [想要使用 python ？](https://alibaba.github.io/pipcook/doc/想要使用python？-zh)
- [了解更多内置 pipeline 的信息](https://alibaba.github.io/pipcook/doc/内置 pipeline 详细介绍-zh)
- [了解更多命令行工具 pipcook-cli 的信息](https://alibaba.github.io/pipcook/doc/pipcook-cli-zh)
- [使用一个之前在 pipcook 训练好的模型](https://alibaba.github.io/pipcook/doc/加载一个训练好的模型进行预测或者再次训练-zh)

<a name="gcbA2"></a>
### 想要 Contribute ?

---

请参考我们的[开发者手册](https://alibaba.github.io/pipcook/doc/开发者手册-zh)
