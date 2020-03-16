# Get Started with Pipeline APIs

This article will show how to build a Pipcook pipeline step by step from an example, so that you can quickly get started with Pipcook and start the Pipcook project. Compared to high-level API, this way let you combine different plugins as you want and provide more flexible way to build pipeline.

## Environment Requirements

- operating system：MacOs, Linux
- Runtime：Node.js >= 10.16， Npm >= 6.1.0
- Python Requirement （If you want to use python bridging）: one of pip/pip3/pip3.6/pip3.7 points to current Python 3.6/3.7.  [See here](./want-to-use-python.md) for more information.

> We strongly recommend that you directly use our docker mirror to ensure that the Pipcook requirements are statisified.

## Quick Start

### Local

First install Pipcook's CLI, it is a Pipcook scaffolding that provides environment initialization, control process start and end, log view and etc.

If you want to use GPU acceleration and Python bridge (for instance, our built-in object detection pipeline), we suggest you use the following docker method:

```sh
$ npm install -g @pipcook/pipcook-cli
```

After the scaffold is installed, you can create a project folder (or integrate into any existing front-end project), and then use the simple instructions of the scaffold to quickly generate the project.

```sh
$ mkdir pipcook-example && cd pipcook-example
$ pipcook init
$ cd pipcook-project
```

At this time, all the relevant environments needed for pipcook have been installed. In addition, some sample files of pipcook project will be generated for you.

We have prepared severaal samples for you in the examples folder. You can run them directly to start a machine learning project pipeline. For example, you can run this file quickly to recognize MNIST  numbers. To start this training, you only need a simple command.

```sh
$ node examples/pipeline-example/pipeline-mnist-image-classfication.js
```

### Docker (GPU recommended mode)

In the case of GPU acceleration, we suggest you use our docker mirror for pipcook training. In the mirror, make sure your system has docker installed correctly before you start.

We can run the following command to pull the mirror.

```sh
$ docker pull pipcook/pipcook:version-0.4
```

First, create a workspace locally. For example, let's create an example folder. If your environment has GPUs that can be used for training (Linux only), NVIDIA ® GPUs that support CUDA, and the correct drivers, you can run the following command to enter the mirror (start the container), and mount your workspace into the docker environment. If CPU training is used, the '-- GPUs all' parameter does not need to be added.

```sh
$ mkdir ${local_workspace} # such as： /Users/queyue/documents/example
$ docker run -it -v ${local_workspace}:/home/workspace -p 7778:7778 --shm-size=1g --gpus all pipcook/pipcook:version-0.4
$ /bin/bash
```

Now, you can enter the project space and use the scaffold we have installed to initialize the project space.

```sh
$ pipcook init
```

We have prepared several sample files for you in the examples folder. You can run them directly to start a machine learning project pipeline. For example, you can quickly carry out a MNIST  number recognition. To start this training, you only need a simple command.

```sh
$ cd pipcook-project
$ node examples/pipeline-example/pipeline-mnist-image-classfication.js
```

### After Training

After the training, the system will start the local deployment, which will be deployed to port 7778 by default. If you are in the local environment, you can follow the prompts to open the browser and start a simple prediction page. If you want to view the previous dataset, or use a sample in the dataset, you can go to the pipcook-output/datasets folder to find your dataset.

At the same time, if you want to view your previously trained models or used training sets, you can run the following command to open pipcook board

```sh
$ pipcook board
```

Do you want to try more? We also have another sample file pipeline-databinding-image-classification.js, pipeline-object-detection.js. This is a training pipeline for field binding image classification model in real production environment of imgcok and a object detection training pipeline for component recognition. You can also try to run these two files (training may take longer in an environment without GPU )

## Your first pipcook project

If you want to know how the above example was written, let's take a step-by-step introduction on how we write a simple Pipcook training file. Suppose you have a scene where you have some picture data about MNIST  images, and you want to use these pictures as training data to train a neural network for classification. Let us do this by writing a pipcook training pipeline step by step. To know which plugins you can choose or what parameters each plugin has or how to use them? [Please move here](../spec/plugin.md).

### Prepare

You can create a new file for the pipeline from scratch, assuming we name this file `pipcook_try.js`.

### Data Collect

At first, we need to collect these  images. In this scenario, we provide the data collection plugin @ali/pipcook-plugins-image-mnist-data-collection. We just need to simply specify the plugin to be used and the parameters required according to the plugin document, and finally pass the parameters to DataCollect Component.

```js
const dataCollect = DataCollect(imageMnistDataCollection, {
  trainingCount:8000,
  testCount: 2000
});
```

### Data Access

The data from different places should be represented as a unified data format according to Pipcook standard format. For example, all the collection should be sent to the downstream in a unified  Pascol VOC format. We have an unified data access layer and use `imageClassDataAccess` plugin.

This plugin can specify the image size we access uniformly and  unify the image to the same size automatically, and transmit it to the downstream through tf.data's standard data processing API. For dataset standards, please refer to [here](../spec/dataset.md).

```js
 // access mnist data into our specifiction
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

### Model Load

In this process, we will load the required model. This model can come from the model you built, or some pre-training models, or even the models of keras and python tensorflow. Finally, we will give a unified model format. In this example, if we want to use mobileNet to classify the MNIST, we use mobileNetModelLoad plugin to do this.

```js
const modelLoad = ModelLoad(mobileNetLoad, {
  modelName: 'test1'
});
```

### Model Train

After loading the model, we start the model training. We use the imageClassModelTrain plugin for model training.

```js
const modelTrain = ModelTrain(imageClassModelTrain, {
  epochs: 15
});
```

### Model Evaluate

After the model training, we also hope to use our test set to evaluate the performance of the model. We can use the imageClassModelEvaluate plugin to do the evaluation.

```js
const modelEvaluate = ModelEvaluate(classModelEvalute);
```

### Start Up

Now we have completed every step of the machine learning life cycle, let's pass each plugin to pipcook runner, and tell pipcook to start a runner to begin the training process, as shown below.

```
const runner = new PipcookRunner()
runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])
```

Now we have completed a pipcook project and you can start it.
