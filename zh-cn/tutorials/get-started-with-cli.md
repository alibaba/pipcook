# 新手入门——命令行工具

[pipcook-cli][] 是 Pipcook 的命令行工具，可以快速的执行一些必要命令，诸如初始化项目，启动可视化
管理界面等。

## 安装

```sh
$ npm install @pipcook/pipcook-cli -g
```

## 初始化项目

```sh
$ pipcook init [OPTIONS]

-c: npm 客户端，比如 tnpm cnpm 等
例如如果您想使用 cnpm，您可以直接运行：
pipcook init -c cnpm
```

## 可视化日志工具

```sh
$ pipcook board
```

[pipcook-cli]: https://github.com/alibaba/pipcook/tree/master/packages/pipcook-cli