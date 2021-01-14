# 开始机器学习

从这篇文章，我们将介绍什么是机器学习，以及如果使用 [Pipcook][] 来完成机器学习任务。

## 如何定义一个机器学习问题

一般来说，一个学习问题就是将 N 个样本集数据输入，然后输出与输入相关联对应的结果，下面的例子将展示，如何教会一个程序学会 Node.js 书籍和售价的关系：

```ts
const BookPriceModel: Record<string, number> = {};
const learnBookPrice = (book: string, price: number) => BookPriceModel[book] = price;
const predictBookPrice = (book: string) => BookPriceModel[book];

// prediction without learning.
predictBookPrice('Node.js in Action'); // undefined, because the program don't know nothing

// learn "Node.js in Action" and "Dive into Node.js".
learnBookPrice('Node.js in Action', 99.0);
learnBookPrice('Dive into Node.js', 199.0);

// prediction after learning.
predictBookPrice('Node.js in Action'); // 99.0
predictBookPrice('Dive into Node.js'); // 199.0
```

**机器学习**问题也是类似的，只不过可以通过机器学习算法让机器能更“智能”地学习，能够对于一些未知数据作出真正的预测结果，比如可以帮助作者决定写一本什么样的书能够卖得更贵：

```js
predictBookPrice('Pipcook in Action'); // 89.0
predictBookPrice('Dive into Pipcook'); // 199.0
```

机器学习并非万能灵药，因此接下来看看它到底能解决哪些问题，下面我们按照数据类型分为不同的任务类型：

| Sample Type      | Problem Category         | Description                    |
|------------------|--------------------------|--------------------------------|
| Image            | 图片分类                   | 对于给定类型的图片进行分类 |
|                  | 图片生成                   | 生成图片 |
|                  | 目标检测                   | 识别出给定的对象，并返回目标的位置和类型 |
|                  | 图片分割                   | 与图片检测类似，但是返回的是目标轮廓的像素级显示 |
|                  | 图片聚类                   | 返回自动分类后的结果 |
| Text             | 文本分类                   | 对于给定类型的文本进行分类 |
|                  | 命名实体识别               | 从一句话中识别出命名实体 |
|                  | 关系提取                   | 抽取句子与句子间的关系 |
|                  | 指代消解                   | 将一句话中的代词转换为实际代表的个体 |
|                  | 写作纠错                   | 辅助写作的纠错功能 |
|                  | 翻译                       | 从一种语言翻译到另一种语言 |
|                  | 问答                       | 根据问题生成对应的回答 |
|                  | 文本摘要                   | 从一段长文本生成摘要文本 |
|                  | 文本创作                   | 生成一些如诗歌、散文、词等艺术作品 |
|                  | 文本聚类                   | 返回自动分类后的结果 |

那么我们如何在日常生活中使用上面的任务呢？我们可以来看看一个机器学习项目都会有哪些阶段：

1. 收集样本，并将他们处理成一种格式，用于给后面定义的模型学习数据中的特征。
2. 选择一个用于训练的机器学习模型，一般来说会根据任务类型和场景进行选择。
3. 在开始训练之前，需要将上面的样本集分为训练集和测试集。
4. 训练阶段，将训练集输入到模型中，此时模型开始从训练集中学习特征。
5. 训练结束后，再使用测试集输入到训练好的模型，来评估模型效果。

> **训练集和测试集**
>
> 机器学习是关于学习数据集的某些特征，然后针对另一个数据集进行测试。机器学习中的一种常见做法是通过将数据集分成两部分来评估算法。我们称其中一组为训练集，在该集上我们学习数据中的特征，我们称另一组为测试集，在测试集上我们对学习的特征进行测试。

## 加载数据集

[MNIST][](Modified National Institute of Standards and Technology database) 是一个手写识别的大型数据集：

<center>
  <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/MnistExamples.png">
</center>

接下来，我们使用手写数字识别作为例子，来介绍如何使用 [Pipcook][] 完成一个图片分类任务。

我们使用 Pipeline 来完整地描述机器学习任务，不同的插件表示这个 Pipeline 中不同的阶段，然后再通过 Pipeline 将不同的阶段连接起来形成一个完整的机器学习工作流。

接着，我们将从加载 [MNIST][] 数据集开始创建 Pipeline：

```js
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-mnist-data-collect",
      "params": {
        "trainCount": 8000,
        "testCount": 2000
      }
    }
  }
}
```

"@pipcook/plugins-mnist-data-collect" 插件会下载 [MNIST][] 数据集，然后按照 `8000:2000` 的比率来分布训练集和测试集。

## 学习

在这个数字识别数据集的例子中，我们的目的是预测一张图片所代表的数字，那么我们给出的样本中，每张图片就拥有10个分类（0-9），这也就是说，我们要让模型做到的是预测一张未知图片的类型，即从0到9的分类。

在 [Pipcook][]，构建一个分类任务的模型就是配置 Pipeline 的 `plugins`。

```js
{
  "plugins": {
    "dataAccess": {
      "package": "@pipcook/plugins-pascalvoc-data-access"
    }
  }
}
```

我们使用 [PASCAL VOC][] 作为我们的魔术输入格式，插件 "@pipcook/plugins-pascalvoc-data-access" 会帮我们将 mnist 数据集转换为 [PASCAL VOC][] 格式。

> [PASCAL VOC][] is to provide standardized image data sets for object class recognition.

```js
{
  "plugins": {
    "dataProcess": {
      "package": "@pipcook/plugins-tensorflow-image-classification-process",
      "params": {
        "resize": [28, 28]
      }
    }
  }
}
```

接下来，我们使用插件 "@pipcook/plugins-tensorflow-image-classification-process" 来调整每张图片的尺寸为 28x28：

```js
{
  "plugins": {
    "modelDefine": {
      "package": "@pipcook/plugins-tfjs-simplecnn-model-define"
    },
    "modelTrain": {
      "package": "@pipcook/plugins-image-classification-tfjs-model-train",
      "params": {
        "epochs": 15
      }
    },
    "modelEvaluate": {
      "package": "@pipcook/plugins-image-classification-tfjs-model-evaluate"
    }
  }
}
```

我们使用 [CNN][] 来做图片分类任务，它包含以下插件：

- "@pipcook/plugins-tfjs-simplecnn-model-define" 用于定义模型。
- "@pipcook/plugins-image-classification-tfjs-model-train" 用于训练基于 tfjs 的模型。
- "@pipcook/plugins-image-classification-tfjs-model-evaluate" 用于评估基于 tfjs 的模型。

目前为止，Pipeline 就定义完成了，接下来就可以开始训练了。

```sh
$ pipcook run pipeline.json
```

## 预测

训练完成后，我们就能发现 output 目录，它里面包含了训练的模型以及用于预测的 JavaScript 文件 `index.js`。

```
📂output
   ┣ 📂logs
   ┣ 📂model
   ┣ 📜package.json
   ┣ 📜metadata.json
   ┗ 📜index.js
```

正如你所见，生成的目录就是一个 NPM 包，你可以把它集成到任何 Node.js 的项目中去，然后使用 `predict()` 方法：

```js
const predict = require('/path/to/output');
const app = express();
app.post('/predict', async (req, res) => {
  const r = await predict(req.body.image);
  res.json(r);
});
app.listen(8080);
```

启动服务：

```sh
$ node app.js
```

使用 CURL 发送请求：

```sh
$ curl -XPOST http://localhost:8080/predict -f"/path/to/your/img.png"
{
  "result": 7
}
```

[Pipcook]: https://github.com/alibaba/pipcook
[MNIST]: https://en.wikipedia.org/wiki/MNIST_database
[Introduction to Pipeline]: ../manual/intro-to-pipeline.md
[PASCAL VOC]: http://host.robots.ox.ac.uk/pascal/VOC/
[CNN]: https://github.com/alibaba/pipcook/blob/master/packages/plugins/model-define/tfjs-simplecnn-model-define/src/index.ts
