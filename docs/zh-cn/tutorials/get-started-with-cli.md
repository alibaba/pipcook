# 新手入门——命令行工具

[pipcook-cli][] 是 Pipcook 的命令行工具，可以快速的执行一些必要命令，诸如初始化项目，启动可视化
管理界面等。

## 安装

```sh
$ npm install @pipcook/pipcook-cli -g
```

## 初始化项目

```sh
$ pipcook init
$ pipcook init -c tnpm
$ pipcook init --tuna # 使用清华大学开源软件镜像来下载 Python
```

## 可视化日志工具

```sh
$ pipcook board
```

[pipcook-cli]: https://github.com/alibaba/pipcook/tree/master/packages/cli

## 启动流水线

```sh
$ pipcook run [pipeline]
```
