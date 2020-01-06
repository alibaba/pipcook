
<a name="c30f113c"></a>
### 代码仓库

我们全部的代码将会开源并托管在我们的 github 仓库中，这里是我们仓库的[地址](https://github.com/alibaba/pipcook)


<a name="8a887b45"></a>
### 环境搭建

- 操作系统：支持 MacOs, Linux
- 运行环境：Node.js >= 10.16， Npm >= 6.1.0
- python要求 （python >= 3.6, pip 指向正确的 python3 路径
- 全局 npm 包: lerna, typescript compiler

想要查看是否正确安装上述环境，可以使用如下命令查看

```
node -v
npm -v
tsc -v
lerna -v
python --version
pip --version
```


<a name="b7ab3ef6"></a>
### 插件开发规范

我们为每个插件定义了一套接口，每个类型的插件需要严格按照接口实现，详细信息如下：

- [Data Collect](https://alibaba.github.io/pipcook/doc/DataCollect 插件-zh)
- [Data Access](https://alibaba.github.io/pipcook/doc/DataAccess 插件-zh)
- [Data Process](https://alibaba.github.io/pipcook/doc/DataProcess 插件-zh)
- [Model Load](https://alibaba.github.io/pipcook/doc/ModelLoad 插件-zh)
- [Model Train](https://alibaba.github.io/pipcook/doc/ModelTrain 插件-zh)
- [Model Evaluate](https://alibaba.github.io/pipcook/doc/ModelEvaluate 插件-zh)
- [Model Deploy](https://alibaba.github.io/pipcook/doc/ModelDeploy 插件-zh)

<a name="078c8c94"></a>
### 如何开发调试一个插件

您可以参考[这里](https://alibaba.github.io/pipcook/doc/如何开发一个插件？-zh)查看如何开发调试一个插件


<a name="e71b4e54"></a>
### 数据集规范

开发时涉及到数据读取处理请参考我们的[数据集规范](https://alibaba.github.io/pipcook/doc/数据集-zh)


<a name="f31ccad5"></a>
### 贡献指南

请参考[这里](https://alibaba.github.io/pipcook/doc/如何贡献-zh)查看 github 提交代码指南
