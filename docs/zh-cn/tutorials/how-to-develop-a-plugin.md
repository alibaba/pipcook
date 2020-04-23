# 如何开发一个插件？

pipcook 非常欢迎开发者为我们贡献插件从而扩展 pipcook 的功能，本文档将会介绍如何开发一个插件，本文所涉及的内容只是一些建议，具体的插件只要符合我们的插件原型规范，即可成功的运行在 pipcook 中。

## 插件规范

首先，我们强烈建议您可以先了解我们定义的插件规范，只要符合我们定义的插件才可以被接受，具体每个插件的规范您可以参考[这里](../devel/developer-guide.md)的插件开发规范。

其中，插件类型可为:

- dataCollect
- dataAccess
- dataProcess
- modelDefine
- modelTrain
- modelEvaluate

## 创建一个插件

一个插件由以下部分组成：

- 一个具名 JavaScript 函数。
- 函数所属的类型 （继承的接口）
- 函数参数：包括 data (对应训练数据信息）, model （模型相关信息）, 和自定义参数
- 函数返回值：插件类型所对应的返回值

[pipcook-cli][] 工具提供了方便的初始化插件开发工作空间的方式，您只需运行如下命令

```sh
$ pipcook plugin-dev -t <插件类型> [-n <插件名称，默认值：template-plugin>]
$ cd template-plugin
$ npm install
```

即可初始化一个开发环境，此开发环境包含如下结构：

```
- template-plugin
  - src
    - index.ts    // 插件代码主入口
  - package.json  // npm 项目配置和依赖文件
  - .npmignore     // npm 发布配置文件
  - tsconfig.json  // typescript 编译配置文件
```

## 自动注入参数和用户参数

如果您查看我们的[插件原型规范](../spec/plugin.md)，你会注意到我们定义的插件主要包含了三个参数，data (非必须), model (非必须), args. 其中, data, model 两个参数是由 pipcook 在执行 pipeline 过程中自动注入的，args 参数则是插件可以自定义的由用户输入的一些参数。在一个插件开发完毕，并且在用户执行 pipeline 的过程中，用户不需要显示的向插件对应的 component 输入 data 和 model 参数，例如一个数据接入插件的 interface 是：

```ts
interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

所以任意一个数据接入插件都包含 data 和 args，两个参数，然而，在用户使用的过程中，用户的代码应该类似于这样：

```ts
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

用户在使用插件时候，并不会直接调用插件，而是通过将插件传入相应的 component，同时传入用户参数，而传入的用户参数则为 args 参数。

## 编写一个插件

本章将通过一个简单的例子展示如何开发一个数据处理插件

### 数据处理插件接口

```ts
export interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

首先我们可以根据上面的链接查看您要开发的插件类型的 interface, 例如数据处理类型的插件如上面所示接受一个 `UniformSampleData` 类型的参数和一个 `ArgsType` 类型的可选参数。其中 `UniformSampleData` 的一个子接口类型如下面所示：

```ts
interface UniformSampleData{
  trainData: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  validationData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  testData?: tf.data.Dataset<{xs: tf.Tensor<any>, ys?: tf.Tensor<any>}>;
  metaData: metaData;
  dataStatistics?: statistic[];
  validationResult?: {
    result: boolean;
    message: string;
  }
}
```

`ArgsType` 是插件期待用户输入的自定义参数。

### 准备 mock 数据

您可以根据接口准备相应的 mock 数据从而进行插件开发，例如我们开发一个数据处理插件，我们可以构造如下的 mock 数据

```ts
const data = {
	trainData: tf.data.array([{xs: [1,2,3], ys: [1]},{xs: [4,5,6], ys: [2]}]),
  metaData: {
    feature: {
    	name: 'train',
      type: 'int32',
      shape: [1,3]
    },
    label: {
    	name: 'test,
      type: 'int32',
      shape: [1]
    },
  }
}
```

例如这个数据处理插件需要把每个 feature 的大小增加一倍，则您可以向如下一样实现您的插件:

```ts
import {DataProcessType, UniformSampleData, ArgsType} from '@pipcook/pipcook-core'

const templateDataProcess: DataProcessType = async (data: UniformSampleData, args?: ArgsType): Promise<UniformSampleData> => {
  const {trainData} = data;
  return {
  	...data,
    trainData: trainData.map((v) => 2*v)
  }
}

export default templateDataProcess;
```

此时在开发好您的插件之后，您需要检查如下两点：

- 您的插件运行良好，没有错误
- 您的插件的返回结果同样符合结果的规范

在确保好上面两点后，您就可以执行一条真实的 pipcook pipeline 去检查您的插件是否和相应的上下游插件兼容。

## 发布流程

当您开发好插件后，您可以建立您自己的 github 仓库，将您的代码和相应的测试用和 push 到您自己的仓库中去，仓库应该命名为 pipcook-plugins-{name}-{type}

同时，您可以向 master 分支上提交 pull request 来提交您的插件文档和相应的说明，步骤如下：

### fork 项目

![image.png](https://img.alicdn.com/tfs/TB1aaMbuKL2gK0jSZFmXXc7iXXa-2006-358.png)

### 克隆本地

![image.png](https://img.alicdn.com/tfs/TB1CWz7uGL7gK0jSZFBXXXZZpXa-718-368.png)

### 根据您的插件创建分支

```sh
$ git checkout -b pipcook-plugins-{name}-{type}
```

### 编写文档

首先，打开文件 [docs/zh-cn/spec/plugin.md](../spec/plugin.md), 更新如下的插件列表：

![image.png](https://img.alicdn.com/tfs/TB14EscuG61gK0jSZFlXXXDKFXa-988-476.png)

### 提交到自己的仓库

```sh
$ git add .
$ git commit -m "plugin doc dev"
$ git push
```

#### 提交 Pull Request

![image.png](https://img.alicdn.com/tfs/TB1IP69uKT2gK0jSZFvXXXnFXXa-1318-172.png)

在通过我们的审核之后，我们将会把您的文档添加进 Pipcook 的官方文档中，并且把您的代码合并到 master 分支中，并把您的插件发布至 Pipcook 的 npm 仓库，同时，您也将会成为 pipcook 开发者。

[pipcook-cli]: https://github.com/alibaba/pipcook/tree/master/packages/cli