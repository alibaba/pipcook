# 使用 Pipcook 分类图片中的前端组件

## 背景
您是否在前端业务中遇到过这样的场景：手中有一些图片，您想有一种自动的方式来识别这些图片究竟是一个什么前端组件，它是一个按钮，还是一个导航栏，又或是一个表格？这便是一个典型的图片分类任务。<br />

> 预测图像类别的任务被称为 图像分类 。训练图像分类模型的目的是识别各类图像

这种识别是非常有用的，您可以用这种识别信息去做代码生成，又或者是自动化测试等。

拿代码生成为例，假设我们有一个 sketch 的设计稿，整个设计稿就是由不同的组件构成的。我们可以遍历整个设计稿的图层，对于每一个图层，使用图片分类的模型识别每一个图层是什么组件，之后我们就可以把原始的设计稿图层替换为前端组件，从而生成前端代码，一个中后台的页面也就因此搞定。


又比如在自动化测试的场景里，我们需要一种能力识别每个图层的类型，对于识别出是按钮的，我们可以自动点击看一下按钮是否工作，对于识别出是 feeds 流的，我们可以自动追踪一下每一次的加载速度来监控性能等等。


## 场景示例
举个例子，我们在中后台表单自动生成的场景里，我们需要识别哪些组件是折线图，哪些是柱状图，饼图或是环形图，如下图所示：
![image.png](https://img.alicdn.com/tfs/TB1EkmVamslXu8jSZFuXXXg7FXa-429-323.png)
![image.png](https://img.alicdn.com/tfs/TB1azNlN7L0gK0jSZFtXXXQCXXa-338-298.png) 
![image.png](https://img.alicdn.com/tfs/TB1FnjUeA9l0K4jSZFKXXXFjpXa-304-240.png)
![image.png](https://img.alicdn.com/tfs/TB1MZWRbMgP7K4jSZFqXXamhVXa-437-319.png)

训练完成之后，对于每一张图片，模型最终会给出我们想要的预测结果。例如，当我们输入图 1 的折线图时，模型会给出类似于以下的预测结果
```json
[[0.1, 0.9, 0.05, 0.05]]
```
同时，我们会在训练的时候生成 labelmap，labelmap 是一个序号和实际类型的一个映射关系，这个的生成主要是由于现实世界我们的分类名是文本的，但是在进入模型之前，我们需要将文本转成数字。下面就是一个 labelmap
```json
{
  "column": 0,
  "line": 1,
  "pie": 2,
  "ring": 3
}
```
首先，为什么预测结果是个二维数组呢？首先，模型是允许一次性预测多张图片的，所以你预测了多少张图片，最外层就会有几个元素。对于每个图片，模型同样会给出一个数组，这个数组描述了各个分类的可能性，如 labelmap 所示，分类是按照 column, line, pie, ring 顺序排列的，那么对应着模型的预测结果，我们可以看到 line (折线图) 的置信度最大，为 0.9，所以这张图片就被预测成了折线图，也就是预测正确了。
<a name="kv3Dw"></a>
## 数据准备
当做类似于这样的图片分类任务时，我们需要按照一定格式组织我们的数据集

我们需要按照一定比例把我们的数据集分成训练集 (train)，验证集 (validation) 和测试集 (test)，其中，训练集主要用来训练模型，验证集和测试集用来评估模型。验证集主要用来在训练过程中评估模型，以方便查看模型过拟合和收敛情况，测试集是在全部训练结束之后用来对模型进行一个总体的评估的。

在训练/验证/测试集里面，我们会按照分类的类别组织数据，例如，我们现在有两个分类，line 和 ring, 那么，我们可以创建两个文件夹分别为这两个分类名，在相应的文件夹下面放置图片。总体目录结构为：

- train
   - ring
      - xx.jpg
      - ...
   - line
      - xxjpg
      - ...
   - column
      - ...
   - pie
      - ...
- validation
   - ring
      - xx.jpg
      - ...
   - line
      - xx.jpg
      - ...
   - column
      - ...
   - pie
      - ...
- test
   - ring
      - xx.jpg
      - ...
   - line
      - xx.jpg
      - ...
   - column
      - ...
   - pie
      - ...

我们已经准备好了一个这样的数据集，您可以下载下来查看一下：[下载地址](http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/datasets/component-recognition-image-classification/component-recognition-classification.zip)
<a name="vWpTg"></a>
## 开始训练
在准备好数据集之后，我们就可以开始训练了，使用 Pipcook 可以很方便的进行图片分类的训练，您只需搭建下面这样的 pipeline，

```json
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-image-classification-data-collect",
      "params": {
        "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/datasets/component-recognition-image-classification/component-recognition-classification.zip"
      }
    },
    "dataAccess": {
      "package": "@pipcook/plugins-pascalvoc-data-access"
    },
    "dataProcess": {
      "package": "@pipcook/plugins-image-data-process",
      "params": {
        "resize": [224, 224]
      }
    },
    "modelDefine": {
      "package": "@pipcook/plugins-tensorflow-mobilenet-model-define",
      "params": {
        "batchSize": 8,
        "freeze": false
      }
    },
    "modelTrain": {
      "package": "@pipcook/plugins-image-classification-tensorflow-model-train",
      "params": {
        "epochs": 15
      }
    },
    "modelEvaluate": {
      "package": "@pipcook/plugins-image-classification-tensorflow-model-evaluate"
    }
  }
}
```
通过上面的插件，我们可以看到分别使用了

1. **@pipcook/plugins-image-classification-data-collect** 这个插件用于下载符合上面描述的图片分类的数据集，主要，我们需要提供 url 参数，我们提供了上面我们准备好的数据集地址
1. **@pipcook/plugins-pascalvoc-data-access **我们现在已经下载好了数据集，我们需要将数据集接入成 pipcook 的格式，以便后续进入模型
1. **@pipcook/plugins-image-data-process** 在进行图片分类时，我们需要对原始的数据进入一些必要的操作，比如，图片分类要求所有的图片是一样大小的，所以我们使用这个插件把图片 resize 成统一大小
1. **@pipcook/plugins-tensorflow-mobilenet-model-define** 我们这里选用 mobilenet 模型来进行训练，这个模型一般用于训练中等复杂的数据，对于更复杂的数据集，推荐您选用 @pipcook/plugins-tensorflow-resnet-model-define 插件
1. **@pipcook/plugins-image-classification-tensorflow-model-train **我们使用此插件来进行训练，这是一个图片分类基于 TensorFlow 的通用插件，和上一阶段具体选择的模型无关
1. **@pipcook/plugins-image-classification-tensorflow-model-train **我们使用此插件来进行模型的评估，模型的评估是指在测试集上模型的表现效果，这是一个图片分类基于 TensorFlow 的通用插件，和上一阶段具体选择的模型无关


[mobilenet](https://zhuanlan.zhihu.com/p/31551004) 是轻量级模型，可以在 cpu 上进行训练，如果使用的是 [resnet](https://zhuanlan.zhihu.com/p/31852747)，由于模型本身比较大，因此在执行这个 Pipeline 之前推荐在有 cuda 环境的 GPU 机器上运行

> CUDA，Compute Unified Device Architecture的简称，是由NVIDIA公司创立的基于他们公司生产的图形处理器GPUs（Graphics Processing Units,可以通俗的理解为显卡）的一个并行计算平台和编程模型。
> 通过CUDA，GPUs可以很方便地被用来进行通用计算（有点像在CPU中进行的数值计算等等）。在没有CUDA之前，GPUs一般只用来进行图形渲染（如通过OpenGL，DirectX）。

```
pipcook run image-classification.json --verbose --tuna
```
往往模型在 10-20 个 epoch 时就会收敛，当然，这取决于您的数据集复杂度。模型收敛是指 loss (损失值) 已经足够低并且准确度已经足够高了，在这种情况，每一个 epoch 对于模型的表现得改变已经不明显了。<br />
<br />具体日志如下：
```json
Epoch 1/15
187/187 [==============================] - 12s 65ms/step - loss: 0.0604 - accuracy: 0.9823 - val_loss: 8.8755 - val_accuracy: 0.4112
Epoch 2/15
187/187 [==============================] - 11s 61ms/step - loss: 0.0056 - accuracy: 0.9993 - val_loss: 5.5883 - val_accuracy: 0.4925
Epoch 3/15
187/187 [==============================] - 11s 59ms/step - loss: 0.0107 - accuracy: 0.9980 - val_loss: 0.3830 - val_accuracy: 0.8388
...
187/187 [==============================] - 11s 61ms/step - loss: 3.0090e-05 - accuracy: 1.0000 - val_loss: 1.5646e-08 - val_accuracy: 1.0000
Epoch 14/15
187/187 [==============================] - 11s 61ms/step - loss: 5.1657e-05 - accuracy: 1.0000 - val_loss: 1.9073e-08 - val_accuracy: 1.0000
Epoch 15/15
187/187 [==============================] - 11s 61ms/step - loss: 5.1657e-05 - accuracy: 1.0000 - val_loss: 1.9073e-08 - val_accuracy: 1.0000
```
训练完成后，会在当前目录生成 output，这是一个全新的 npm 包，那么我们首先安装依赖：
```json
cd output
BOA_TUNA=1 npm install
```
安装好环境之后（设置 BOA_TUNA 使用清华镜像源来下载 Python 相关的依赖），我们就可以开始预测啦：
```js
const predict = require('./output');
(async () => {
  const v1 = await predict('./test.jpg');
  console.log(v1); 
  // [[0.1, 0.9, 0.05, 0.05]]
})();
```
注意，我们给出的预测结果是每个类别的概率, 您可以对这个概率进行处理到您想要的结果。
<a name="Na1wV"></a>
## 总结
这样，基于图片分类模型的组件识别任务就完成了。在完成了我们例子中的 pipeline 之后，如果你对这类任务感兴趣，也可以开始准备自己的数据集进行训练了。前面我们在数据准备的章节里已经详细介绍了数据集的格式，你只需要按照文件目录的方式就可以很轻松的准备符合我们图片分类 pipeline 的数据了。<br />
相信读者到这里已经学会如何对一张图片中的前端组件进行分类了，可以适用于一些相对比较特别的例子，但在组件识别的大场景中，往往一张图片会包括不同的多个组件，那么这时候分类模型可能就无法应对这种需求了，因此在下一篇文章，我们会介绍如何使用 Pipcook 完成设计图中多个组件的识别。
