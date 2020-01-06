# 如何开发一个插件？

pipcook 非常欢迎开发者为我们贡献插件从而扩展 pipcook 的功能，本文档将会介绍如何开发一个插件，本文所涉及的内容只是一些建议，具体的插件只要符合我们的插件原型规范，即可成功的运行在 pipcook 中。


<a name="ff93a5f0"></a>
### 插件规范

---

首先，我们强烈建议您可以先了解我们定义的插件规范，只要符合我们定义的 interface 的插件才可以被接受，具体每个插件的规范您可以参考[这里](https://alibaba.github.io/pipcook/doc/开发者手册-zh)的插件开发规范


<a name="bf4fba37"></a>
### 插件开发环境初始化

---

pipcook cli 工具提供了方便的初始化插件开发工作空间的方式，您只需运行如下命令

```typescript
pipcook plugin-dev -t 插件类型
cd template-plugin
npm install
```

其中，插件类型可为:

- dataAccess
- dataCollect
- dataProcess
- modelEvaluate
- modelLoad
- modelTrain

即可初始化一个开发环境，此开发环境包含如下结构

- template-plugin
  - src
    - index.ts    // 插件代码主入口
  - package.json  // npm 项目配置和依赖文件
  - .npmignore     // npm 发布配置文件
  - tsconfig.json  // typescript 编译配置文件


<a name="b7c0bfff"></a>
### 调试

---

在开发过程中，如果您想要查看您插件代码运行的中间态，我们首先建议您对插件的输入先做一个 mock 数据，此数据须符合相关的原型接口。如果您觉得您的插件开发完毕，您可以进入到 pipcook 项目目录中， 然后运行

```typescript
npm link ${插件根目录}
```

将插件安装至 pipcook 项目下，然后可以在 examples 文件中创建 test 文件，将您的插件与其他相关插件链接进行尝试/
