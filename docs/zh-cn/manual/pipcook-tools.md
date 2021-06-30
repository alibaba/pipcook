# Pipcook Tools

Pipcook Tools 是 Pipcook 提供给开发者使用的命令行工具，它帮助开发者运行和管理 Pipeline。

## 安装

```sh
$ npm install @pipcook/cli -g
```

查看[安装指南](../INSTALL.md)查看完成的安装引导。

## 使用指南

运行一个 Pipeline，只需要执行如下命令：

```sh
$ pipcook run protocal://location/to/your/pipeline-config.json
```

支持的 pipeline 文件协议包括: `http:`, `https:`, `file:`, 默认为 `file:` 协议.
更多运行参数可以通过以下命令获取：

```sh
$ pipcook run --help
```

> 关于如何编写 pipeline, 可以看[这里](./intro-to-pipeline.md).

## 缓存管理

通过 `pipcook run` 命令运行 Pipeline 时，如果 Script 或 framework 为非 `file` 协议，则会将其缓存到 `~/.pipcook` 目录下，以便加速下次运行。
如果想手动删除这些缓存，可以通过以下命令:
```sh
$ pipcook clean
```
