# PipApp 使用指南

> 该功能为实验功能

PipApp 可以让开发者不用关心复杂的机器学习 Pipeline，从而将更多的精力集中在编写机器学习应用逻辑，并且它能让开发者更好地将传统编程的业务逻辑与机器学习的代码更好地结合起来。

## 准备工作

通过[命令行工具配置指南](./pipcook-tools.md#环境设置)来做运行 PipApp 前的准备。

## 快速开始

下面我们先就来看一个简单的例子：

```js
import { createLearnable, nlp } from '@pipcook/app';

const isProduct = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

const isBook = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

(async () => {
  console.log(await isProduct('test'));
  console.log(await isBook('booking test'));
})();
```

通过上面的例子，首先通过 `createLearnable` 来创建一个机器学习上下文，你可以把它理解成一种特殊的 async function，只有在 `Learnable` 函数块中才能使用 PipApp 提供的 API。

我们分别创建了两个机器学习流程，在其中都使用了 `nlp.classify` 来完成一个文本分类的任务。

> 注意：我们为了能够获取到足够的信息，PipApp 要求使用 TypeScript 来编写。

### 初始化项目

与运行 Pipeline 不同，PipApp 需要创建一个完整的项目目录，因此在开始之前，我们需要从初始化一个 Node.js 项目开始。

```sh
$ npm init
$ npm install @pipcook/app --save
```

因为所有的 API 都在 `@pipcook/app` 包内，所以需要增加依赖。

### 编译项目

好了，创建好项目以及完成代码之后，就可以开始编译项目了，它的主要目的是分析项目代码并生成对应的 Pipeline 和项目文件。

```sh
$ pipcook app compile /path/to/your/project/script.ts
generated 2 pipelines, please click the following links to config them:
(nlp.classify) > http://localhost:6927/index.html#/pipeline/info?pipelineId=1a287920-b10e-11ea-a743-792a596edff1
(nlp.classify) > http://localhost:6927/index.html#/pipeline/info?pipelineId=1a287921-b10e-11ea-a743-792a596edff1
```

可以看到执行完命令后，会提示配置 Pipeline，通过链接点击进去去配置即可，开发者需要根据不同的调用接口来配置不同的数据，比如第一个分类是为了对产品进行分类，那么我们配置 Pipeline 的时候，就要准备跟产品分类相关的数据集。

### 训练

当配置完成后，保存 Pipeline，就可以开始训练了（注意，这里一定需要使用命令行工具的训练入口才可生效。

```sh
$ pipcook app train /path/to/your/project/script.ts
```

训练过程中可以在 Pipboard 上查看训练进度，也可以通过以下命令单独查看：

```sh
$ pipcook app status /path/to/your/project/script.ts
job(0acee5e0-b1e5-11ea-85a3-dbb717ca8e27):
  pipeline: http://localhost:6927/index.html#/pipeline/info?pipelineId=1a287920-b10e-11ea-a743-792a596edff1
  status: success
  evaluate: {"pass":true,"accuracy":0.927570093457944}
job(0d043c70-b1e5-11ea-85a3-dbb717ca8e27):
  pipeline: http://localhost:6927/index.html#/pipeline/info?pipelineId=1a287921-b10e-11ea-a743-792a596edff1
  status: success
  evaluate: {"pass":true,"accuracy":0.927570093457944}
```

### 构建可执行包

当所有模型训练完成后，就可以开始构建最终的应用包了：

```sh
$ pipcook app build /path/to/your/project/script.ts
```

构建完成后，会在目录下生成 `{filename}.ml.js` 文件，使用 Node.js 运行即可。

## 限制

由于目前 PipApp 还是实验性的功能，因此开放的 API 较少，目前仅提供：文本分类和图片分类供大家尝鲜，另外在写法上也有一些限制：

仅支持根作用域下使用 `createLearnable()`，比如：

```js
const foo = createLearnable(() => {
  const bar = createLearnable(...);
});
```

不支持对模块的引用调用，比如：

```js
import { createLearnable, nlp } from '@pipcook/app';

const foo = createLearnable((s: string) => {
  const nlp2 = nlp;
  nlp2.classify(s);
});
```
