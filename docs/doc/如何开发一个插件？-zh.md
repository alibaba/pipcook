# 如何开发一个插件？

pipcook 非常欢迎开发者为我们贡献插件从而扩展 pipcook 的功能，本文档将会介绍如何开发一个插件，本文所涉及的内容只是一些建议，具体的插件只要符合我们的插件原型规范，即可成功的运行在 pipcook 中。


<a name="ff93a5f0"></a>
### 插件规范

---

首先，我们强烈建议您可以先了解我们定义的插件规范，只要符合我们定义的 interface 的插件才可以被接受，具体每个插件的规范您可以参考[这里](https://alibaba.github.io/pipcook/doc/%E5%BC%80%E5%8F%91%E8%80%85%E6%89%8B%E5%86%8C-zh)的插件开发规范

其中，插件类型可为:

- dataCollect
- dataAccess
- dataProcess
- modelLoad
- modelTrain
- modelEvaluate
- modelDeploy

<a name="bf4fba37"></a>
### 创建一个插件

---

一个插件由以下部分组成：

- 一个具名 JavaScript 函数。
- 函数所属的类型 （继承的接口）
- 函数参数：包括 data (对应训练数据信息）, model （模型相关信息）, 和自定义参数
- 函数返回值：插件类型所对应的返回值

pipcook-cli 工具提供了方便的初始化插件开发工作空间的方式，您只需运行如下命令

```
pipcook plugin-dev -t <插件类型>
cd template-plugin
npm install
```


即可初始化一个开发环境，此开发环境包含如下结构

- template-plugin
  - src
    - index.ts    // 插件代码主入口
  - package.json  // npm 项目配置和依赖文件
  - .npmignore     // npm 发布配置文件
  - tsconfig.json  // typescript 编译配置文件


<br />

<a name="5AOjl"></a>
### 自动注入参数和用户参数

---

如果您查看我们的[插件原型规范](https://alibaba.github.io/pipcook/doc/%E5%BC%80%E5%8F%91%E8%80%85%E6%89%8B%E5%86%8C-zh)，你会注意到我们定义的插件主要包含了三个参数，data (非必须), model (非必须), args. 其中, data, model 两个参数是由 pipcook 在执行 pipeline 过程中自动注入的，args 参数则是插件可以自定义的由用户输入的一些参数。在一个插件开发完毕，并且在用户执行 pipeline 的过程中，用户不需要显示的向插件对应的 component 输入 data 和 model 参数，例如一个数据接入插件的 interface 是：

```
interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

所以任意一个数据接入插件都包含 data 和 args，两个参数，然而，在用户使用的过程中，用户的代码应该类似于这样：

```
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

用户在使用插件时候，并不会直接调用插件，而是通过将插件传入相应的 component，同时传入用户参数，而传入的用户参数则为 args 参数。

<a name="doESO"></a>
### 编写一个插件

---

本章将通过一个简单的例子展示如何开发一个数据处理插件
<a name="fdRb0"></a>
#### 数据处理插件接口

```
export interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}
```

首先我们可以根据上面的链接查看您要开发的插件类型的 interface, 例如数据处理类型的插件如上面所示接受一个 UniformSampleData 类型的参数和一个 ArgsType 类型的可选参数。其中 UniformSampleData 的一个子接口类型如下面所示

```
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

ArgsType 是插件期待用户输入的自定义参数。

<a name="unEcd"></a>
#### 准备 mock 数据
您可以根据接口准备相应的 mock 数据从而进行插件开发，例如我们开发一个数据处理插件，我们可以构造如下的 mock 数据

```
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

```
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

<a name="CQJZ0"></a>
### 发布流程

---

当您开发好插件后，您可以建立您自己的 github 仓库，将您的代码和相应的测试用和 push 到您自己的仓库中去，仓库应该命名为 pipcook-plugins-xxx-(plugin type)

同时，您可以向 master 分支上提交 pull request 来提交您的插件文档和相应的说明，步骤如下：

<a name="C8oUt"></a>
#### fork 项目
![image.png](https://cdn.nlark.com/yuque/0/2020/png/654014/1580538912983-a2f236f1-454f-4d17-be67-a1c88fb42f1a.png#align=left&display=inline&height=179&name=image.png&originHeight=358&originWidth=2006&size=219404&status=done&style=none&width=1003)

<a name="0prlf"></a>
#### 克隆本地
![image.png](https://cdn.nlark.com/yuque/0/2020/png/654014/1580538946503-934368a7-9e53-403e-9299-9d6bfa707493.png#align=left&display=inline&height=184&name=image.png&originHeight=424&originWidth=828&size=176376&status=done&style=none&width=359)

<a name="qadiP"></a>
#### 根据您的插件创建分支

```
git checkout -b pipcook-plugins-xxx-<plugin type>
```

<a name="rSehE"></a>
#### 编写文档
首先，编辑文件 pipcook/docs/doc/插件介绍-zh.md 和 pipcook/docs/doc/Introduction of pipcook plugin-en.md, 更新如下的插件列表

![image.png](https://cdn.nlark.com/yuque/0/2020/png/654014/1580539222364-f158701f-c01a-48e5-b744-49aee210f91b.png#align=left&display=inline&height=238&name=image.png&originHeight=700&originWidth=1454&size=516382&status=done&style=none&width=494)

然后，在 pipcook/docs/doc 中新建两个文档，分别为您的插件的中英文介绍，在上面的列表中建立超链接指向您的新文档。在文档中，应该包含怎样安装插件和您自己的仓库地址

<a name="slBaM"></a>
#### 提交到自己 fork 的仓库

```
git add . && git commit -m "plugin doc dev" && git push
```

<a name="v8XsX"></a>
#### 提交 Pull Request

![image.png](https://cdn.nlark.com/yuque/0/2020/png/654014/1580539335805-714c29f9-9901-4bca-b16f-b98dde74a608.png#align=left&display=inline&height=86&name=image.png&originHeight=172&originWidth=1318&size=131735&status=done&style=none&width=659)

在通过我们的审核之后，我们将会把您的文档添加进 pipcook 的官方文档中，并且把您的代码合并到 master 分支中，并把您的插件发布至 pipcook 的 npm仓库，同时，您也将会成为 pipcook 的开发者之一。
