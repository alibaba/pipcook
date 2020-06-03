# 安装

现在有以下两种不同的方式来安装 [Pipcook][]：

- [通过 NPM 安装][] 对于大多数用户来说，这是最好的方法。它将提供一个稳定的版本，并且预编译的软件包可用于大多数平台。
- [通过源码安装][] 这是最适合需要最新和最强大功能而又不怕运行全新代码的用户，希望为该项目做出贡献的开发者也需要这样做。

在开始安装之前，需要保证下面的环境：

- macOS, Linux
- Node.js 12

## 通过 NPM 安装

安装 [Pipcook][] 只需运行下面的命令即可：

```sh
$ npm install -g @pipcook/pipcook-cli
```

然后通过 `pipcook --help` 来检查安装是否成功。

## 通过 Docker 安装

首先安装 [Pipcook Dockerfile](https://github.com/alibaba/pipcook/blob/master/Dockerfile)，然后在该路径下构建镜像：

```sh
$ git clone https://github.com/alibaba/pipcook.git && cd pipcook
$ docker build -t alibaba/pipcook .
```

检查是否成功构建：

```sh
$ docker images
REPOSITORY                                    TAG                 IMAGE ID            CREATED             SIZE
alibaba/pipcook                               latest              c297c73d62d4        7 hours ago         3.67GB
```

然后运行:

```sh
$ docker run -it --name pipcook_test alibaba/pipcook /bin/bash
```

## 疑难排查

如果你有任何安装方面的问题，清反馈到我们的 [issue tracker](https://github.com/alibaba/pipcook/issues/new)。

[通过 NPM 安装]: #通过-NPM-安装
[通过源码安装]: contributing/guide-to-contributor#download-source
[Pipcook]: https://github.com/alibaba/pipcook
