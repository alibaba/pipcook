# 安装

现在有以下两种不同的方式来安装 [Pipcook][]：

- [通过 NPM 安装][] 对于大多数用户来说，这是最好的方法。它将提供一个稳定的版本，并且预编译的软件包可用于大多数平台。
- [通过源码安装][] 这是最适合需要最新和最强大功能而又不怕运行全新代码的用户，希望为该项目做出贡献的开发者也需要这样做。

在开始安装之前，需要保证下面的环境：

- macOS, Linux
- Node.js 12.17 以上 / 14.0.0 以上

## 通过 NPM 安装

安装 [Pipcook][] 只需运行下面的命令即可：

```sh
$ npm install -g @pipcook/cli
```

然后通过 `pipcook --help` 来检查安装是否成功。

## 通过 Docker 安装

我们提供了阿里源 docker 镜像，您可以运行如下命令安装

```sh
$ docker pull registry.cn-beijing.aliyuncs.com/pipcook/pipcook:latest
```

安装完成之后，可以运行如下命令启动 docker

```sh
$ docker run -it registry.cn-beijing.aliyuncs.com/pipcook/pipcook:latest /bin/bash
```

## 疑难排查

如果你有任何安装方面的问题，请反馈到我们的 [issue tracker](https://github.com/alibaba/pipcook/issues/new)。

[通过 NPM 安装]: #通过-NPM-安装
[通过源码安装]: contributing/guide-to-contributor#download-source
[Pipcook]: https://github.com/alibaba/pipcook
