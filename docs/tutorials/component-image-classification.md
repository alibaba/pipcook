# Classify images of UI components

## Background

Have you encountered such a scenario in the front-end business: there are some images in your hand, and you want an automatic way to identify what front-end components these images are, whether it is a button, a navigation bar, or a form? This is a typical image classification task.

> The task of predicting image categories is called image classification. The purpose of training the image classification model is to identify various types of images.

This identification is very useful. You can use this identification information for code generation or automated testing.

Taking code generation as an example, suppose we have a sketch design draft and the entire design draft is composed of different components. We can traverse the layers of the entire design draft. For each layer, use the model of image classification to identify what component each layer is. After that, we can replace the original design draft layer with the front-end component to generate the front-end code.

Another example is in the scenario of automated testing. We need an ability to identify the type of each layer. For the button that is recognized, we can automatically click to see if the button works. For the list component that we recognize, we can automatically track loading speed to monitor performance, etc.

## Examples

For example, in the scenario where the forms are automatically generated, we need to identify which components are column charts or pie charts, as shown in the following figure:

![image.png](https://img.alicdn.com/tfs/TB17LbHNQL0gK0jSZFAXXcA9pXa-293-172.png)

![image.png](https://gw.alicdn.com/tfs/TB13I2LNQY2gK0jSZFgXXc5OFXa-442-369.png) 

After the training is completed, for each picture, the model will eventually give us the prediction results we want. For example, when we enter the line chart of Figure 1, the model will give prediction results similar to the following:

```
[[0.1, 0.9]]
```

At the same time, we will generate a labelmap during training. Labelmap is a mapping relationship between the serial number and the actual type. This generation is mainly due to the fact that our classification name is text, but before entering the model, we need to convert the text Into numbers. Here is a labelmap:

```json
{
  "column": 0,
  "pie": 1,
}
```

First, why is the prediction result a two-dimensional array? First of all, the model allows prediction of multiple pictures at once. For each picture, the model will also give an array, this array describes the possibility of each classification, as shown in the labelmap, the classification is arranged in the order of column chart and pie chart, then corresponding to the prediction result of the model, We can see that the column chart has the highest confidence, which is 0.9, so this picture is predicted to be a column chart, that is, the prediction is correct.

## Data Preparation

When we are doing image classification tasks similar to this one, we need to organize our dataset in a certain format.

We need to divide our dataset into a training set (train), a validation set (validation) and a test set (test) according to a certain proportion. Among them, the training set is mainly used to train the model, and the validation set and the test set are used to evaluate the model. The validation set is mainly used to evaluate the model during the training process to facilitate viewing of the model's overfitting and convergence. The test set is used to perform an overall evaluation of the model after all training is completed.

In the training/validation/test set, we will organize the data according to the classification category. For example, we now have two categories, line and ring, then we can create two folders for these two category names, in the corresponding Place pictures under the folder. The overall directory structure is:

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

We have prepared such a dataset, you can download it and check it out：[Download here](http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/datasets/component-recognition-image-classification/component-recognition-classification.zip).

## Start Training

After the dataset is ready, we can start training. Using Pipcook can be very convenient for the training of image classification. You only need to build the following pipeline:
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
Through the above plugins, we can see that they are used separately:

1. **@pipcook/plugins-image-classification-data-collect** This plug-in is used to download the dataset that meets the image classification described above. Mainly, we need to provide the url parameter, and we provide the dataset address that we prepared above
1. **@pipcook/plugins-pascalvoc-data-access** Now that we have downloaded the dataset, we need to convert the dataset to pipcook format so that we can use the model later
1. **@pipcook/plugins-image-data-process** When performing image classification, we need to have some necessary operations on the original data. For example, image classification requires that all pictures are of the same size, so we use this plugin to resize the pictures to a uniform size
1. **@pipcook/plugins-tensorflow-mobilenet-model-define**  We use this plugin to choose the model. The models are genrally defined in model-define plugins.
1. **@pipcook/plugins-image-classification-tensorflow-model-train**  We use this plugin for training. This is a general plugin for image classification based on TensorFlow, which has nothing to do with the model selected in the previous stage.
1. **@pipcook/plugins-image-classification-tensorflow-model-train** We use this plugin for evaluating. This step is to give out the performance of the model we have trained on previous step

[mobilenet](https://arxiv.org/abs/1704.04861) is a lightweight model which can be trained on CPU. If you are using [resnet](https://arxiv.org/abs/1512.03385)，since the model is quite large, we recommend use to train on GPU. 

> CUDA, short for Compute Unified Device Architecture, is a parallel computing platform and programming model founded by NVIDIA based on the GPUs (Graphics Processing Units, which can be popularly understood as graphics cards).

> With CUDA, GPUs can be conveniently used for general purpose calculations (a bit like numerical calculations performed in the CPU, etc.). Before CUDA, GPUs were generally only used for graphics rendering (such as through OpenGL, DirectX).

```shell
$ pipcook run image-classification.json
```

Often the model will converge at 10-20 epochs. Of course, it depends on the complexity of your dataset. Model convergence means that the loss (loss value) is low enough and the accuracy is high enough.

Logs are as following:
```
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
After the training is completed, output will be generated in the current directory, which is a brand-new npm package, then we first install dependencies:

```shell
$ cd output
$ npm install
```
After installing the environment , we can start to predict:

```js
const predict = require('./output');
(async () => {
  const v1 = await predict('./test.jpg');
  console.log(v1); 
  // [[0.1, 0.9, 0.05, 0.05]]
})();
```
Note that the prediction result we give is the probability of each category. You can process this probability to the result you want.

## Conclusion

In this way, the component recognition task based on the image classification model is completed. After completing the pipeline in our example, if you are interested in such tasks, you can also start preparing your own dataset for training. We have already introduced the format of the dataset in detail in the data preparation chapter. You only need to follow the file directory to easily prepare the data that matches our image classification pipeline.
