# Built-in pipeline detail

<a name="6WNZz"></a>
## Image Classification
We have builtin  plugins that can be combined to complete a pipeline of image classification. The following describes how the pipeline works by introducing plugins of each step. For the relevant code, you can find [here](https://github.com/alibaba/pipcook/blob/master/example/pipeline-databinding-image-classification.js)
<a name="5qFXQ"></a>
#### Data Collect
We have built-in two plug-ins related to image classification.

The first is [@pipcook/pipcook-plugins-image-mnist-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-collect-en) , This plug-in is a classic sample dataset specially designed to collect mnist image data for users to quickly experience pipcook. This plug-in will download and collect mnist data as our standard [Dataset format](https://alibaba.github.io/pipcook/doc/Dataset-en) .

Second [@pipcook/pipcook-plugins-image-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-collect-en) , This plug-in is a more general image classification data collection plug-in, which can be used to download your own datasets. This plug-in accepts a url or a local path to download a user's compressed file, which contains the train/validation/test folder, and each folder contains a folder with several category names, the following are pictures of this category. Users only need to package and upload their data to a certain place or store them locally according to this format, and then use this plug-in to collect them successfully.

<a name="BuVDD"></a>
#### Data Access
We provide a built-in image classification data access plug-in. [@pipcook/pipcook-plugins-image-class-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-access-en)<br />We believe that after the Data Collect plug-in, image classification already has a standard dataset format. This plug-in connects this standard format to pipeline and converts it to tf. batch data in the form of data for downstream training

<a name="Diid7"></a>
#### Data Process
We provide a built-in image classification data processing plug-in. [@pipcook/pipcook-plugins-image-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-class-data-process-en) , This plug-in provides simple processing functions for images, including normalization, rotation, color change, etc. You can use this plug-in to process image data before entering the model.

<a name="ovECv"></a>
#### Model Load
For image classification, we have two built-in plug-ins for users to choose from. [@pipcook/pipcook-plugins-local-mobilenet-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-local-mobilenet-model-load-en) And [@pipcook/pipcook-plugins-simple-cnn-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-simple-cnn-model-load-en) .

@ Pipcook/pipcook-plugins-simple-cnn-model-load loads a CNN network that contains five convolution layers. This network is mainly used to classify some simple images, @ pipcook/pipcook-plugins-local-mobilenet-model-load loads the MobileNet v1 network back to handle more complex problems.

<a name="HeXlz"></a>
#### Model Train
We provide built-in model training plug-ins [@pipcook/pipcook-plugins-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-model-train-en) , This plug-in is mainly used to start the model loaded in the previous step and related data for model training.

<a name="DdEm9"></a>
#### Model Evaluate
We provide a built-in Model Evaluation plug-in. [@pipcook/pipcook-plugins-model-evaluate,](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-en) This plug-in mainly reads the test set part of the previous data (if any) and the trained model, and evaluates the performance of the model. For the standard TfJs model, the metric based on the set metrics will be returned.

<a name="fa4Uv"></a>
#### Model Deploy
Currently, we have a built-in plug-in that deploys the trained model to the local

<a name="D4TgZ"></a>
## Object Detection
We have built-in multiple plug-ins that can be combined to complete a pipeline for object detection. Note that this object detection pipeline is based on the open source framework detectron of facebook, which depends on the python environment, if you want to use our Python bridge, please refer here to configure the environment. The following describes how this pipeline works by introducing the plug-ins of each step. For relavant codes, see [Here](https://github.com/alibaba/pipcook/blob/master/example/pipeline-object-detection.js)
<a name="5HEOk"></a>
#### Data Collect
We have built-in coco data format data collection plug-in for object detection [@pipcook/pipcook-plugins-image-coco-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-image-coco-data-collect-en) , This plug-in is a general-purpose plug-in for collecting object detection problem data. This plug-in accepts a url or local path, which can be remote or local. To use the local path, you must add file: // before the path. The path must point to a zip compressed file that contains an image folder and a json annotation file, the image folder contains all the pictures. The annotation file is the annotation in coco format. For more information about coco format, see here.
<a name="SwqAD"></a>
#### Data Access
We provide the built-in detectron2 object detection data access plug-in. [@pipcook/pipcook-plugins-detection-detectron-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-data-access-en)<br />This plug-in is used for data access in the detectron2 training pipeline. This plug-in accesses the data received by detectron2.

<a name="B3GtH"></a>
#### Model Load
We provide a built-in object detection model loading plug-in. [@pipcook/pipcook-plugins-detection-detectron-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-load-en) Load a object detection model

<a name="Ye7qy"></a>
#### Model Train
We provide built-in model training plug-ins [@pipcook/pipcook-plugins-detection-detectron-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-train-en) , This plug-in is mainly used to start the model loaded in the previous step and related data for model training.

<a name="WbFYq"></a>
#### Model Evaluate
We provide a built-in Model Evaluation plug-in. [@pipcook/pipcook-plugins-detection-detectron-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-detection-detectron-model-evaluate-en) , This plug-in will evaluate the model passing the test set


<a name="iNyBx"></a>
## Text Classification
We have builtin  plugins that can combine to complete a pipeline of text classification. The text classification  this stage is based on the traditional machine learning Bayes classifier, not the deep learning model, this pipeline is mainly used to show that pipcook can also be used for traditional machine learning training. We hope that developers can contribute a text classification pipeline based on the deep nlp model in the future. For relavant codes, see here

<a name="NHa7O"></a>
#### Data Collect
We have built-in data collection plug-in for text classification [@pipcook/pipcook-plugins-text-class-data-collect](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-collect-en) , This plug-in is a general-purpose plug-in for collecting text problem data. This plug-in accepts a url or a local path. This url should point to a compressed csv file, which contains two columns, the first column is the text content, and the second column is the category name of the category.

<a name="ATWc6"></a>
#### Data Access
We provide built-in text classification data access plug-ins [@pipcook/pipcook-plugins-text-csv-data-access](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-csv-data-access-en)<br />We believe that after the Data Collect plug-in, the text already has a standard dataset format. This plug-in connects this standard format to pipeline and converts it into batch data in the form of tf. Data for downstream training.

<a name="XwrKs"></a>
#### Data Process
We provide built-in text classification processing plug-ins [@pipcook/pipcook-plugins-text-class-data-process](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-text-class-data-process-en) , This plug-in is mainly used for word segmentation. For some traditional classification models, the original text content needs to be segmented, which is also equivalent to a layer of processing to extract features.

<a name="BgcQN"></a>
#### Model Load
We provide a built-in object detection model loading plug-in. [@pipcook/pipcook-plugins-bayesian-classifier-model-load](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-load-en) Load a Bayes classifier

<a name="MY3ED"></a>
#### Model Train
We provide a built-in training plug-in for Bayes classifier. [@pipcook/pipcook-plugins-bayesian-classifier-model-train](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-bayesian-classifier-model-train-en) , This plug-in is mainly used to start the model loaded in the previous step and related data for model training.

<a name="8FJjZ"></a>
#### Model Evaluate
We provide a built-in Model Evaluation plug-in. [@pipcook/pipcook-plugins-model-evaluate](https://alibaba.github.io/pipcook/doc/@pipcook-pipcook-plugins-class-model-evaluate-en) , This plug-in mainly reads the test set part of the previous data (if any) and the trained model, and evaluates the performance of the model. For the standard TfJs model, the metric based on the set metrics will be returned.
