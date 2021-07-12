# 术语表

术语表用于表达 Pipcook 中的若干的默认、隐式约定，同时为用户和贡献者提供参考。它旨在描述概念，并详细说明其相应的 API 或至文档的其他相关部分。 通过从接口文档或用户手册中的链接跳转过来并查阅术语含义，这样可以最大程度地减少阅读中的不一致。

### Pipboard

Pipcook Board 的缩写，在 Pipboard 上，您可以通过 Web 来管理你的 Pipeline 和插件。

### Pipcook

指 Pipcook 项目，一般来说指向 GitHub(https://github.com/alibaba/pipcook) 地址。

### Pipcook Daemon

用于管道 Pipeline 和执行，它通过 HTTP 提供对 [Pipcook Tools][] 和 [Pipboard][] 的远程访问，同时也支持其他客户端通过 HTTP 集成Pipcook Daemon。

### Pipcook script

在 Pipeline 中，脚本就像乐高积木，用户选择不同的脚本，就可以快速完成不同的 Pipeline 的搭建，并训练出不同的模型。

### Pipcook Tools

Pipcook 命令行工具的简称，通过 `npm install -g @pipcook/cli` 安装。

### Pipeline

在计算机系统中，Pipeline（也称为数据流）是一组串联连接的数据处理节点，其中一个节点的输出是下一个节点的输入。 Pipeline 的节点通常以并行或按时间分割的方式执行。

[Pipcook Tools]: #pipcook-tools
[Pipboard]: #pipboard
