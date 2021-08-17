# Machine Learning Overview

From this article, we will introduce what is machine learning and how to complete a task of machine learning with [Pipcook][].

## Define Machine Learning Problem

In general, a learning problem considers a set of n samples of data and then tries to returns the corresponding result by given input. The following example shows how we can teach a program about Node.js books and prices:

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

The **Machine Learning** problem is similar, except that we can make the computer learning more intelligent through machine learning algorithms and can give real "predictions" from unknown data, for example, The following helps you get a more expensive book name:

```js
predictBookPrice('Pipcook in Action'); // 89.0
predictBookPrice('Dive into Pipcook'); // 199.0
```

However machine learning is not a panacea, so let's see what problems it can solve, the following is machine learning problems fall into a few categories in given sample types(Image and Text):

| Sample Type      | Problem Category         | Description                    |
|------------------|--------------------------|--------------------------------|
| Image            | Image Classification     | it does classify the image to specific classes. |
|                  | Image Generation         | it generates an image automatically. |
|                  | Object Detection         | it detects the given objects and returns class and position for each one. |
|                  | Image Segmentation       | it returns the outline of given objects in pixel. |
|                  | Image Clustering         | it returns clusters from images. |
| Text             | Text Classification      | it does classify the text to specific classes. |
|                  | Named Entity Recognition | it recognizes the named entity from a sentence. |
|                  | Relationship Extraction  | it extracts the relationships between sentences. |
|                  | Coreference Resolution   | it does the pronouns and other referring to be connected with the right individuals. |
|                  | Writing Correction       | it helps to do writing correction. |
|                  | Machine Translation      | it translates a language to target language. |
|                  | Question and Answering   | it generates an answer by the given question. |
|                  | Text Summary             | it generates a summary for your given long text. |
|                  | Text Creation            | it generates an artwork by a given portfolio. |
|                  | Text Clustering          | it returns clusters from words or sentences. |

So how do we achieve the above prediction in our life? Let's take a look at the stages involved in a machine learning project:

1. Collect samples and process them into a format from which machine learning models can learn features.
2. Choose a machine learning model for training, generally choose different models according to different task types and scenarios.
3. Before training the model, we need to divide the above samples into a training set and a testing set in a ratio.
4. Then during the training stage, we input the training set into the model, so that it will learn the features from that.
5. After the model is trained, generally use the testing set to input the trained model again to determine how effective the model is.

> **Training set and Testing set**
>
> Machine learning is about learning some properties of a data set and then testing those properties against another data set. A common practice in machine learning is to evaluate an algorithm by splitting a data set into two. We call one of those sets the training set, on which we learn some properties, we call the other set the testing set, on which we test the learned properties.

## Loading Dataset

[MNIST][](Modified National Institute of Standards and Technology database) is a large database of handwritten digits:

<center>
  <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/MnistExamples.png">
</center>

Next, we will use handwritten digit recognition as an example to introduce how to complete an image classification task completely through [Pipcook][].

In [Pipcook][], we use the pipeline to completely describe a machine learning task. We use different scripts in Pipeline to provide different nodes, and then connect the different scripts through Pipeline as a whole.

In the following, we start writing a Pipeline from loading the [MNIST][] datasets which define a [datasource script](https://github.com/imgcook/pipcook-script/blob/master/scripts/image-classification-mobilenet/src/datasource.ts):

```js
{
  "datasource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@fe00a8e/scripts/image-classification-mobilenet/build/datasource.js?url=http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/mnist.zip"
}
```

This script will download data from the standard [MNIST][] dataset, and return the data access API.

## Learning

In the case of the digits dataset, the task is to predict, given an image, which digit it represents. We are given samples of each of the 10 possible classes (the digits zero through nine) on which we fit a model to be able to predict the classes to which unseen samples belong.

In [Pipcook][], building a model for classification is also `script` configuration.

we use [image classification dataflow](https://github.com/imgcook/pipcook-script/blob/master/scripts/image-classification-mobilenet/src/dataflow.ts) to resize the image to 224x224 in our dataset represented by an array `[224, 224]`, which is required for the next step.
```js
{
  "dataflow": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@fe00a8e/scripts/image-classification-mobilenet/build/dataflow.js?size=224&size=224"
}
```


Then define the [model script](https://github.com/imgcook/pipcook-script/blob/master/scripts/image-classification-mobilenet/src/model.ts) and paremeters for train:
```js
{
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-script@fe00a8e/scripts/image-classification-mobilenet/build/model.js",
  "options": {
    "framework": "mobilenet@1.0.0",
    "train": {
      "epochs": 20,
      "validationRequired": true
    }
  }
}
```

This script will use [mobilenet][] to do image classification tasks, training and evaluating tfjs-based models.

So far, our pipeline is defined completely, and then we can train.

```sh
$ pipcook run pipeline.json
```

## Predicting

After the training is completed, we can find an `model` directory under the current project directory, which is our trained model.

```
📂 model
   ┣ 📜 model.json
   ┗ 📜 weights.bin
```


[Pipcook]: https://github.com/alibaba/pipcook
[MNIST]: https://en.wikipedia.org/wiki/MNIST_database
[Introduction to Pipeline]: ../manual/intro-to-pipeline.md
[mobilenet]: https://github.com/imgcook/pipcook-script/blob/master/scripts/image-classification-mobilenet
