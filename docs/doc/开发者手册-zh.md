
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

- [Data Collect](https://www.yuque.com/znzce0/in8hih/ckdry3)
- [Data Access](https://www.yuque.com/znzce0/in8hih/rq1nts)
- [Data Process](https://www.yuque.com/znzce0/in8hih/nqvrti)
- [Model Load](https://www.yuque.com/znzce0/in8hih/hz4zpl)
- [Model Train](https://www.yuque.com/znzce0/in8hih/dzh0tg)
- [Model Evaluate](https://www.yuque.com/znzce0/in8hih/wsmdyu)
- [Model Deploy](https://www.yuque.com/znzce0/in8hih/iklc1d)

<a name="078c8c94"></a>
### 如何开发调试一个插件

您可以参考[这里](https://www.yuque.com/znzce0/in8hih/gigy6w)查看如何开发调试一个插件


<a name="e71b4e54"></a>
### 数据集规范

开发时涉及到数据读取处理请参考我们的[数据集规范](https://www.yuque.com/znzce0/in8hih/gy0dyg)


<a name="f31ccad5"></a>
### 贡献指南

请参考[这里](https://www.yuque.com/znzce0/in8hih/xwcudz)查看 github 提交代码指南
