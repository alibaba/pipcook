# Get started

This topic describes how to quickly train a machine learning model from examples.

<a name="wvxFK"></a>
### Environment preparation

- Operating system: MacOs and Linux are supported
- Runtime Environment: Node. js> = 10.16, Npm> = 6.1.0
- Python requirements (if python Bridge is required) pip/pip3/pip3.6/pip3.7 one of them points to the correct python 3.6/python3.7 path. For more information, see [Here](https://www.yuque.com/znzce0/in8hih/ic1cvg)

Or we strongly recommend that you directly use our docker image to ensure that the pipcook runtime environment is correct.

<a name="KKc8r"></a>
### Environment initialization and quick start

<a name="PEMXT"></a>
#### Local

(If you want to use gpu acceleration and the object detection python-bridge link based on detectron2, we recommend that you use docker way). First install the pipcook scaffold pipcook-cli, which provides environment initialization, control the start and end of the process, and view logs.

```sh
$ npm install -g @pipcook/pipcook-cli
```

After the scaffold is installed, you can create a project folder (or integrate it into any existing front-end project), and then use a few simple instructions of the scaffold to quickly generate a project.

```sh
$ mkdir pipcook-example && cd pipcook-example
$ pipcook init
$ cd pipcook-project
```

At this point, all the relevant environments required by Pipcook have been installed. In addition, some examples  of the Pipcook project are generated for you.<br />In the generated project workspace, we have prepared two examples for you in the examples/pipcook-app folder. You can directly run them to start a machine learning engineering pipeline. For example, you can quickly perform image classification recognition. To start this training, you only need a simple command

```sh
$ node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```

<a name="BLMFh"></a>
#### Docker Way(GPU recommended mode)
In scenarios where gpu acceleration is required, we recommend that you use our Docker image for pipcook training. In our image, before you start, make sure that your system has installed Docker correctly<br />Run the following command to pull the image:

```sh
$ docker pull pipcook/pipcook:version-0.4
```

First, create a workspace locally. For example, create an example folder. If your environment has a GPU that can be used for training (Linux only), NVIDIA that supports CUDA®GPU and the correct driver, you can run the following command to enter the image (start the container), and mount your workspace into the docker environment. If you use CPU training, you do not need to add the -- gpus all parameter.

```sh
$ mkdir ${local_workspace}
$ docker run -it -v ${local_workspace}:/home/workspace -p 7778:7778 --shm-size=1g --gpus all pipcook/pipcook:version-0.4
/bin/bash
```

Now, you can enter the project and initialize the project using the scaffold that we have installed.

```sh
$ pipcook init
```

```sh
$ cd pipcook-project
$ node examples/pipcook-app-example/pipcook-imageclass-app-test.js
```


<a name="DbcKB"></a>
### High Level API details

Currently, we have prepared two high-level APIs for Your Task: image classification and object detection:

<a name="r4Eqz"></a>
#### Image Classification

```js
const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.imageClassification('mobilenet' // the network to load, currently support mobilenet or simplecnn
, {
  imageSize: [256, 256], // optional，default is [256,256]. the image size to resize
  optimizer: ..., // optional，default is tf.train.rmsprop. type of optimizer，more details at https://js.tensorflow.org/api/latest/#Training-Optimizers
  loss: ..., // optional，default is categoricalCrossentropy. type of loss function，more details at https://js.tensorflow.org/api/latest/#Training-Losses
  metrics: ..., // optional，default is ['accuracy']. metrics to evaluate model，more details at https://js.tensorflow.org/api/latest/#Metrics
})

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip' // url of train data, you can check url to see data format required
, {
  epochs: 15, // optional，default is 10. 
  batchSize: 16, // optional，default is 32
}, false);
```

<a name="OIoeS"></a>
#### Object Detection

```js
const pipcook = require('@pipcook/pipcook-app').default;

const classifier = new pipcook.objectDetection('faster-rcnn', {
  device: 'cpu' | 'gpu', // optional，default is to use cpu to train
  baseLearningRate: number, // optional，default is 0.00025. the base learning rate
  numWorkers: number, // optional，default is 2. number of workers to use
  maxIter: number, // optional，default is 100000. iterations to run
  numGpus: number, // optional，default is 2. max number of gpus to use
});

classifier.train('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip' // url of train data, you can check sample to see data format
, {
  testSplit: 0.01 // optional，default is 0. percent of data to treat as test dataset.
});
```

