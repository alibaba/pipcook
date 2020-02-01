# 快速入门

本文将从实例的角度，一步步搭建出一个 Pipcook 应用，让你能快速的入门 Pipcook， 启动 Pipcook 工程

<a name="wvxFK"></a>
### 环境准备

---


- 操作系统：支持 MacOs, Linux
- 运行环境：Node.js >= 10.16， Npm >= 6.1.0
- python要求 （如果要用到python桥接功能）: python >= 3.6, pip 指向正确的 python3 路径, 关于更多信息，可参考[这里](https://alibaba.github.io/pipcook/doc/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F-zh)

或者我们强烈建议您直接使用我们的 docker 镜像，以确保 pipcook 的运行环境正确

<a name="KKc8r"></a>
### 环境初始化和快速体验

---

<a name="PEMXT"></a>
#### 本地方式
(如果您想使用 gpu加速功能和基于 detectron2 的目标检测 python 桥接链路，我们建议您使用下面的 docker 方式安装) 首先安装 pipcook 脚手架 pipcook-cli, 此工具将提供环境初始化，控制流程开始与结束，日志查看等功能。
```
sudo npm install -g @pipcook/pipcook-cli
```

安装好脚手架之后，可以创建工程文件夹 (或者集成进现有的任何前端项目)，然后使用脚手架简单的几条指令快速生成项目

```
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-project
```

此时，Pipcook 所有需要的相关的环境已经安装完毕，此外，还会为您生成一些 Pipcook 工程的样例文件<br />在生成的项目空间里，我们在 examples 文件夹里为您准备了两个样例文件， 您可以直接运行他们去开始一个机器学习工程 pipeline. 例如，您可以快速运行这个文件进行一次mnist 手写数字的识别，想要开始这个训练，您只需要一个简单的命令

```
node examples/pipeline-mnist-image-classification.js
```


想要尝试更多？我们还有另外的样例文件 pipeline-databinding-image-classification.js, pipeline-object-detection.js, 这是用于 Imgcook 真实生产环境中的字段绑定图片分类模型的训练管道 和 组件识别的目标检测训练管道，您也可以尝试运行这两个文件 （在没有 GPU 的环境中训练可能需要更长的时间）

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

我们在 examples 文件夹里为您准备了两个样例文件， 您可以直接运行他们去开始一个机器学习工程 pipeline. 例如，您可以快速进行一次mnist 手写数字的识别，想要开始这个训练，您只需要一个简单的命令

```
cd pipcook-project
node examples/pipeline-mnist-image-classfication.js
```

<a name="vHxNL"></a>
#### 训练完成后

训练完成后，系统将会启动本地部署，默认会部署到 7778端口，如果在本地环境，您可以按照提示打开浏览器启动一个简单的预测页面。如果您想要查看之前的数据集，或者使用数据集中的某个样本，可以进入 .pipcook-log/datasets 文件夹找到您的数据集

同时，如果您想要查看你之前训练过的模型或者使用过的训练集，您可以运行如下命令打开 pipcook-board

```
pipcook board
```

想要尝试更多？我们还有另外的样例文件 pipeline-databinding-image-classification.js, pipeline-object-detection.js, 这是用于 Imgcook 真实生产环境中的字段绑定图片分类模型的训练管道 和 组件识别的目标检测训练管道，您也可以尝试运行这两个文件 （在没有 GPU 的环境中训练可能需要更长的时间）

<a name="1SeMS"></a>
### 编写您第一个的第一个 Pipcook 工程

---

如果您想了解上面的样例文件是如何编写的，下面我们将一步步介绍我们如何编写一个简单的 Pipcook 训练周期。 假设您有一个场景，您有一些关于mnist 手写数字的图片数据，您想用这些图片作为训练数据训练一个神经网络用来做分类，让我们通过一步步编写一个 Pipcook 文件来做到这些事情。想要了解有哪些插件可以选择或是想要了解每个插件有哪些参数或者怎么使用插件？请[移步这里](https://alibaba.github.io/pipcook/doc/%E6%8F%92%E4%BB%B6%E4%BB%8B%E7%BB%8D-zh)
<a name="lLXG5"></a>
#### 准备
您可以创建一个新的文件来从头开始编写 Pipcook 训练周期，假设我们将此文件命名为 pipcook_try.js

<a name="94FTH"></a>
#### 数据收集
第一步，我们需要将这些分散的图片按照固定的数据集规范统一收集过来，在这个场景里，我们提供了 mnist 的数据收集插件  @ali/pipcook-plugins-image-mnist-data-collection 我们只需要简单的指定需要用到的插件以及根据插件文档此插件所需的参数, 最终将这个参数传给 DataCollect Component 即可

```
const dataCollect = DataCollect(imageMnistDataCollection, {
  trainingCount:8000,
  testCount: 2000
});
```

<a name="qFI64"></a>
#### 数据接入
Pipcook 支持在单个的工程中配置多个数据收集的来源，这些来自不同地方的数据应该被表示为统一的数据格式，例如，在图片问题中，所有的收集应该以统一的 PASCOL VOC 格式传入下游，我们有一个统一的数据接入层，我们使用 imageClassDataAccess 插件,  传入DataAccess Component。 此插件可以指定我们统一接入的图片尺寸，插件将自动把图片统一到一样的尺寸，并且以 tf.Data 的标准数据处理 API 传入下游，关于数据集标准，请参考[这里](https://alibaba.github.io/pipcook/doc/%E6%95%B0%E6%8D%AE%E9%9B%86-zh)

```
 // access mnist data into our specifiction
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

<a name="5NRhP"></a>
#### 模型载入
在这个过程里，我们将会载入所需要的模型，这个模型可以来自于您自己搭建的模型，或者一些预训练的模型，甚至于加载 keras 和 python tensorflow 的模型，最终给出一个统一的模型格式，在这个例子中，假设我们想要用 mobileNet 进行mnist 的分类，我们使用 mobileNetModelLoad 插件来做这个事情

```
const modelLoad = ModelLoad(mobileNetLoad, {
  modelName: 'test1'
});
```

<a name="E2W4h"></a>
#### 模型训练
加载完模型后，我们启动模型开始训练，此插件和模型载入插件尽可能的不耦合，我们使用 imageClassModelTrain 插件来进行模型训练

```
const modelTrain = ModelTrain(imageClassModelTrain, {
  epochs: 15
});
```

<a name="kZA0G"></a>
#### 模型评估
在模型的训练完成之后，我们还希望用我们的测试集去评估一下模型的表现，我们可以使用 imageClassModelEvaluate 插件去做评估

```
const modelEvaluate = ModelEvaluate(classModelEvalute);
```

<a name="GFyfS"></a>
#### 启动 Runner
现在我们对于机器学习生命周期的每一步的环节就已经编写完成啦，下面我们要将每一个插件传入给 Pipcook runner，并告诉 Pipcook 启动一个 runner 去开始训练流程，如下所示

```
const runner = new PipcookRunner('test1', {
  predictServer: true
})
runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])
```

现在我们已经编写好了一个 Pipcook 工程，之后您就可以启动一个 Pipcook 工程了

