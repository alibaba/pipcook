# 常见问题

## 我应该在哪里放置我的 pipeline 的配置文件?
<a id="q1"></a>
Pipcook 会在后台启动服务，用户可以通过 cli 工具或者可视化工具访问服务。因此，我们对您的工作目录没有特别的要求，你可以在任意地方放置你的配置文件。只需要使用 `pipcook run <url>` 并且指定正确的配置文件路径就可以进行训练了

## 为什么 Pipcook 安装非常缓慢？
<a id="q2"></a>
目前 Pipcook 的安装依赖于 npm 源和 pip 源。有可能这些默认源的链接非常缓慢。你可以指定 `pipcook init -c <npm client>` 去改变你的 npm 源，同时，你也可以使用 `pipcook init --tuna` 指定 pip 清华源。

## 我可以在 Electron 里面使用 Pipcook 吗？
<a id="q3"></a>
理论上只要 Node.js >= 12.19 并且相应的 N-API 可用，你就可以使用 Pipcook。同时，Pipcook 也将会支持产出 WASM 模型所以你可以非常容易的集成到你的系统中去

## Pipcook 支持 Windows 系统吗？
<a id="q4"></a>
目前不支持，未来将会支持。
