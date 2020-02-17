# 高阶 API - 快速入门

本文将从实例的角度出发，带您快速训练一个机器学习模型

<a name="wvxFK"></a>
### 环境准备

---


- 操作系统：支持 MacOs, Linux
- 运行环境：Node.js >= 10.16， Npm >= 6.1.0
- python要求 （如果要用到python桥接功能) pip/pip3/pip3.6/pip3.7 其中之一指向正确的 python3.6/python3.7 路径, 关于更多信息，可参考[这里](https://alibaba.github.io/pipcook/doc/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F-zh)

或者我们强烈建议您直接使用我们的 docker 镜像，以确保 pipcook 的运行环境正确

<a name="KKc8r"></a>
### 环境初始化和快速体验

---

<a name="PEMXT"></a>
#### 本地方式
(如果您想使用 gpu加速功能和基于 detectron2 的目标检测 python 桥接链路，我们建议您使用 docker 方式) 首先安装 pipcook 脚手架 pipcook-cli, 此工具将提供环境初始化，控制流程开始与结束，日志查看等功能。
```
sudo npm install -g @pipcook/pipcook-cli
```

安装好脚手架之后，可以创建工程文件夹 (或者集成进现有的任何前端项目)，然后使用脚手架简单的几条指令快速生成项目

```
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-project
```
（如果您在使用国内的 npm 客户端，如 cnpm， 那么您可以使用 pipcook init -c cnpm 来初始化)

此时，Pipcook 所有需要的相关的环境已经安装完毕，此外，还会为您生成一些 Pipcook 工程的样例文件<br />在生成的项目空间里，我们在 examples/pipcook-app 文件夹里为您准备了两个样例文件， 您可以直接运行他们去开始一个机器学习工程 pipeline. 例如，您可以快速进行一次图片分类识别，想要开始这个训练，您只需要一个简单的命令

```
node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```


<a name="BLMFh"></a>
#### Docker 方式 (GPU 推荐方式)
在需要使用gpu加速的场景下，我们建议您使用我们的 Docker 镜像进行 pipcook 的训练。在我们的镜像中，在开始之前，请确保您的系统已经正确安装了 Docker<br />我们可以运行如下命令拉取镜像

```
docker pull pipcook/pipcook
```

首先在本地创建一个工作空间，例如我们创建一个 example 文件夹，如果您的环境有可以用于训练的 GPU (仅限Linux), 具有支持CUDA的NVIDIA®GPU和正确的驱动程序，您可以运行如下命令进入镜像（启动容器），并且将您的工作空间 mount 进入 docker 环境。如果使用 CPU 训练，则不需要加 --gpus all 参数
```
mkdir ${local_workspace} // 例如： /Users/queyue/documents/example
docker run -it -v ${local_workspace}:/home/workspace -p 7778:7778 --shm-size=1g --gpus all pipcook/pipcook /bin/bash
```

现在，您可以进入到项目空间里，并且使用我们已经安装好的脚手架初始化项目空间

```
pipcook init
```

```
cd pipcook-project
node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```


<a name="DbcKB"></a>
### 高阶 API 详细介绍

---

目前我们为您准备了两种任务的高阶 API， 它们分别是图片分类和目标检测：

<a name="r4Eqz"></a>
#### 图片分类

```
const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.imageClassification('mobilenet' // 加载网络类型，目前支持 mobilenet 和 simplecnn
, {
  imageSize: [256, 256], // 可选参数，默认为 [256,256], resize 成统一的图片大小，可根据分辨率要求调整,
  optimizer: ..., // 可选参数，默认为 tf.train.rmsprop, 优化器类型，具体可参考 https://js.tensorflow.org/api/latest/#Training-Optimizers
  loss: ..., // 可选参数，默认为 categoricalCrossentropy, 损失函数类型，具体可参考 https://js.tensorflow.org/api/latest/#Training-Losses
  metrics: ..., //可选参数，默认为 ['accuracy'], 模型评估指标，具体可参考 https://js.tensorflow.org/api/latest/#Metrics
})

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip' //您的训练数据的地址，格式参考 url 中的数据
, {
  epochs: 15, // 可选参数，默认为10, 跑多少个 epoch
  batchSize: 16, // 可选参数，默认为 32, 每个 batch 的样本数量
}, false);
```

<a name="OIoeS"></a>
#### 目标检测

```
const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.objectDetection('faster-rcnn', {
  device: 'cpu' | 'gpu', // 可选参数，默认为 cpu 训练
  baseLearningRate: number, // 可选参数，默认为 0.00025, 学习率
  numWorkers: number, // 可选参数，默认为 4, 线程数
  maxIter: number, // 可选参数，默认为 100000， 训练多少循环
  numGpus: number, // 可选参数，默认为 2， 最多使用几个 gpu
});

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip' // 训练数据源，可以参考 url 中的数据格式
, {
  testSplit: 0.01 // 可选参数，默认为0， 百分之多少被作为测试集
});
```

