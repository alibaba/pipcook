# Quick Start

This article will show how to build a Pipcook pipeline step by step from an example, so that you can quickly get started with Pipcook and start the Pipcook project.

<a name="wvxFK"></a>
### Prepare the environment

---


- operating system：MacOs, Linux
- Runtime：Node.js >= 10.16， Npm >= 6.1.0
- Python Requirement （If you want to use python bridging）: python >= 3.6, pip points to the correct python3 path.  [See here](https://alibaba.github.io/pipcook/doc/Want%20to%20use%20python%3F-en) for more information.

We strongly recommend that you directly use our docker mirror to ensure that the pipcook runtime environment is correct.

<a name="KKc8r"></a>
### Environment initialization and quick start

---

<a name="PEMXT"></a>
#### Local

First install piphook-cli , it is a pipcook scaffolding that provides environment initialization, control process start and end, log view and etc.

If you want to use GPU acceleration  and python bridge (for instance, our built-in object detection pipeline), we suggest you use the following docker method

```typescript
sudo npm install -g @pipcook/pipcook-cli
```

After the scaffold is installed, you can create a project folder (or integrate into any existing front-end project), and then use the simple instructions of the scaffold to quickly generate the project.

```typescript
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-project
```

At this time, all the relevant environments needed for pipcook have been installed. In addition, some sample files of pipcook project will be generated for you.

We have prepared severaal samples for you in the examples folder. You can run them directly to start a machine learning project pipeline. For example, you can run this file quickly to recognize MNIST  numbers. To start this training, you only need a simple command.

```typescript
node examples/pipeline-mnist-image-classfication.js
```

<a name="BLMFh"></a>
#### Docker  (GPU recommended mode)

In the case of GPU acceleration, we suggest you use our docker mirror for pipcook training. In the mirror, make sure your system has docker installed correctly before you start.

We can run the following command to pull the mirror.

```typescript
docker pull pipcook/pipcook
```

First, create a workspace locally. For example, let's create an example folder. If your environment has GPUs that can be used for training (Linux only), NVIDIA ® GPUs that support CUDA, and the correct drivers, you can run the following command to enter the mirror (start the container), and mount your workspace into the docker environment. If CPU training is used, the '-- GPUs all' parameter does not need to be added.

```typescript
mkdir ${local_workspace} // such as： /Users/queyue/documents/example
docker run -it -v ${local_workspace}:/home/workspace -p 7778:7778 --shm-size=1g --gpus all pipcook/pipcook /bin/bash
```

Now, you can enter the project space and use the scaffold we have installed to initialize the project space.

```typescript
pipcook init
```

We have prepared several sample files for you in the examples folder. You can run them directly to start a machine learning project pipeline. For example, you can quickly carry out a MNIST  number recognition. To start this training, you only need a simple command.

```typescript
cd pipcook-project
node examples/pipeline-mnist-image-classfication.js
```


<a name="m3sMv"></a>
#### After the training
After the training, the system will start the local deployment, which will be deployed to port 7778 by default. If you are in the local environment, you can follow the prompts to open the browser and start a simple prediction page. If you want to view the previous dataset, or use a sample in the dataset, you can go to the .pipcook-log/datasets folder to find your dataset.

At the same time, if you want to view your previously trained models or used training sets, you can run the following command to open pipcook board

```typescript
pipcook board
```

Do you want to try more? We also have another sample file pipeline-databinding-image-classification.js, pipeline-object-detection.js. This is a training pipeline for field binding image classification model in real production environment of imgcok and a object detection training pipeline for component recognition. You can also try to run these two files (training may take longer in an environment without GPU )

<a name="1SeMS"></a>
### Your first pipcook project

---

If you want to know how the above example was written, let's take a step-by-step introduction on how we write a simple Pipcook training file. Suppose you have a scene where you have some picture data about MNIST  images, and you want to use these pictures as training data to train a neural network for classification. Let us do this by writing a pipcook training pipeline step by step. To know which plugins you can choose or what parameters each plugin has or how to use them? [Please move here](https://alibaba.github.io/pipcook/doc/Introduction%20of%20pipcook%20plugin-en).

<a name="lLXG5"></a>
#### Prepare

You can create a new file for the pipeline from scratch, assuming we name this file pipcook_try.js

<a name="94FTH"></a>
#### Data collect

At first, we need to collect these  images. In this scenario, we provide the data collection plugin @ali/pipcook-plugins-image-mnist-data-collection. We just need to simply specify the plugin to be used and the parameters required according to the plugin document, and finally pass the parameters to DataCollect Component.

```typescript
const dataCollect = DataCollect(imageMnistDataCollection, {
  trainingCount:8000,
  testCount: 2000
});
```

<a name="qFI64"></a>
#### Data access
The data from different places should be represented as a unified data format according to pipcook standard format. For example,  all the collection should be sent to the downstream in a unified  PASCOL VOC format. We have a unified data access layer and use the imageClassDataAccess plugin.

This plugin can specify the image size we access uniformly and  unify the image to the same size automatically, and transmit it to the downstream through tf.data's standard data processing API. For dataset standards, please refer to [here](https://github.com/alibaba/pipcook/wiki/%E6%95%B0%E6%8D%AE%E9%9B%86).

```typescript
 // access mnist data into our specifiction
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```

<a name="5NRhP"></a>
#### Model load

In this process, we will load the required model. This model can come from the model you built, or some pre-training models, or even the models of keras and python tensorflow. Finally, we will give a unified model format. In this example, if we want to use mobileNet to classify the MNIST, we use mobileNetModelLoad plugin to do this.

```typescript
const modelLoad = ModelLoad(mobileNetLoad, {
  modelName: 'test1'
});
```

<a name="E2W4h"></a>
#### Model train
After loading the model, we start the model training. We use the imageClassModelTrain plugin for model training.

```typescript
const modelTrain = ModelTrain(imageClassModelTrain, {
  epochs: 15
});
```

<a name="kZA0G"></a>
#### Model evaluate

After the model training, we also hope to use our test set to evaluate the performance of the model. We can use the imageClassModelEvaluate plugin to do the evaluation.

```typescript
const modelEvaluate = ModelEvaluate(classModelEvalute);
```

<a name="GFyfS"></a>
#### Start runner

Now we have completed every step of the machine learning life cycle, let's pass each plugin to pipcook runner, and tell pipcook to start a runner to begin the training process, as shown below.

```typescript
const runner = new PipcookRunner('test1', {
  predictServer: true
})
runner.run([dataCollect, dataAccess, modelLoad, modelTrain, modelEvaluate])
```

Now we have completed a pipcook project and you can start it.

