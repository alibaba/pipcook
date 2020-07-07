# Machine Learning Overview

From this article, we will introduce what is machine learning and how to complete a task of machine learning with [Pipcook][].

## The Problem Setting

In general, a learning problem considers a set of n samples of data and then tries to returns the corresponding result by given input. The following example shows how we can teach a program about Node.js books and prices:

```ts
const BookPriceModel: Record<string, number> = {}
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

In [Pipcook][], we use the pipeline to completely describe a machine learning task. We use different plugins in Pipeline to provide different nodes, and then connect the different plugins through Pipeline as a whole.

In the following, we start writing a Pipeline from loading the [MNIST][] datasets:

```js
{
  "plugins": {
    "package": "@pipcook/plugins-mnist-data-collect",
    "params": {
      "trainCount": 8000,
      "testCount": 2000
    }
  }
}
```

The "@pipcook/plugins-mnist-data-collect" plugin will download data from the standard [MNIST][] dataset, and distribute the training set and the testing set according to the ratio of `8000:2000`.

> **Where to save the pipeline file?**
>
> Run `pipcook init` to create a new project, it will download plugins and their dependencies, and you will use them later.
> See [Introduction to Pipeline][] for more details.

## Learning

In the case of the digits dataset, the task is to predict, given an image, which digit it represents. We are given samples of each of the 10 possible classes (the digits zero through nine) on which we fit a model to be able to predict the classes to which unseen samples belong.

In [Pipcook][], building a model for classification is also `plugins` configuration.

```js
{
  "plugins": {
    "dataAccess": {
      "package": "@pipcook/plugins-pascalvoc-data-access"
    }
  }
}
```

We use [PASCAL VOC][] as the dataset format in our pipeline, the "@pipcook/plugins-pascalvoc-data-access" plugin does transfer the minist dataset in [PASCAL VOC][] format.

> [PASCAL VOC][] is to provide standardized image data sets for object class recognition.

```js
{
  "plugins": {
    "dataProcess": {
      "package": "@pipcook/plugins-image-data-process",
      "params": {
        "resize": [28, 28]
      }
    }
  }
}
```

Next, we use the plugin "@pipcook/plugins-image-data-process" to resize the image to 28x28 in our dataset, which is required for the next step.

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

We choose a [CNN][] for this task of Image Classification as using the following plugins:

- "@pipcook/plugins-tfjs-simplecnn-model-define" is to define the model.
- "@pipcook/plugins-image-classification-tfjs-model-train" is to train the defined model from given training set.
- "@pipcook/plugins-image-classification-tfjs-model-evaluate" is to test the trained model with the testing set.

So far, our pipeline is defined completely, and then we can train.

```sh
$ pipcook run pipeline.json
```

## Predicting

After the training is completed, we can find an `output` directory under the current project directory, which is our trained model and a JavaScript file `index.js` to predict.

```
📂output
   ┣ 📂logs
   ┣ 📂model
   ┣ 📜package.json
   ┣ 📜metadata.json
   ┗ 📜index.js
```

As you can see, the deploy folder is an npm package. You can integrate it into any Node.js project and use the `predict()` method provided by it.

```js
const predict = require('/path/to/output');
const app = express();
app.post('/predict', async (req, res) => {
  const r = await predict(req.body.image);
  res.json(r);
});
app.listen(8080);
```

Then start your service:

```sh
$ node app.js
```

And send a request for prediction:

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
