# Detect the UI components from a design draft

## Background

Have you ever encountered such a scenario in the front-end business: there are some pictures in your hand, and you want an automatic way to identify which components are included in this picture, where these components are located in the picture, and which type components are of. This kind of task are generally called object detection in the field of deep learning.

> Object detection refers to finding targets from a scene (picture), including two processes: where and what

This kind of detection is very useful. For example, in the research of code generation from image, the front-end code is mainly composed of div, img and span. We can identify the shape, bitmap, and text position in the image, and then directly generate the corresponding codes.

This tutorial will teach you how to train a model to do such a detection task.

## Scenario
For example, as shown in the following, this picture contains multiple components, including buttons, switches, input boxes, etc., we want to identify their location and type：

![image.png](https://gw.alicdn.com/tfs/TB1YxdPfz39YK4jSZPcXXXrUFXa-1300-140.png)

For the trained model, after inputting this picture, the model will output the following prediction results:
```js
{
  boxes: [
    [83, 31, 146, 71],  // xmin, ymin, xmax, ymax
    [210, 48, 256, 78],
    [403, 30, 653, 72],
    [717, 41, 966, 83]
  ],
  classes: [
  	0, 1, 2, 2  // class index
  ],
  scores: [
  	0.95, 0.93, 0.96, 0.99 // scores
  ]
}
```
At the same time, we will generate a labelmap during training. Labelmap is a mapping relationship between the serial number and the actual type. This generation is mainly due to the fact that our classification name is text, but before entering the model, we need to convert the text into numbers. Here is a labelmap
```json
{
  "button": 0,
  "switch": 1,
  "input": 2
}
```
Let’s explain the above prediction results

- boxes：This field describes the position of each component identified, displayed in the order of the upper left and lower right corners, such as [83, 31, 146, 71], indicating that the coordinates of the upper left corner of this component are (83, 13), lower right corner are (146, 71)
- classes: This field describes the category of each component. Combined with labelmap, we can see that the identified components are buttons, switches, input boxes and input boxes.
- scores: The confidence of each identified component. The confidence is how much information the model has for the results it has identified. Generally, we will set a threshold. We only take the results with confidence greater than this threshold.

## Data Preparation

When we want to do such a task of object detection, we need to make, collect and store our dataset according to certain specifications. There are two main types of datasets for object detection in the industry today, which are [Coco Data Set] (https ://cocodataset.org/) and [Pascal Voc](http://host.robots.ox.ac.uk/pascal/VOC/) datasets. We also provide corresponding data collection plugins to collect these two data formats. We take Pascal Voc format as an example, the file directory is

- train
   - 1.jpg
   - 1.xml
   - 2.jpg
   - 2.xml
   - ...
- validation
   - 1.jpg
   - 1.xml
   - 2.jpg
   - 2.xml
   - ...
- test
   - 1.jpg
   - 1.xml
   - 2.jpg
   - 2.xml
   - ...


We need to divide our dataset into a training set (train), a validation set (validation) and a test set (test) according to a certain proportion. Among them, the training set is mainly used to train the model, and the validation set and the test set are used to evaluate the model. The validation set is mainly used to evaluate the model during the training process to facilitate viewing of the model's overfitting and convergence. The test set is used to perform an overall evaluation of the model after all training is completed.


For each picture, Pascal Voc specifies an xml annotation file to record which components and the location of each component in this picture. A typical xml file content is:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<annotation>
   <folder>less_selected</folder>
   <filename>0a3b6b38-fb11-451c-8a0d-b5503bc351e6.jpg</filename>
   <size>
      <width>987</width>
      <height>103</height>
   </size>
   <segmented>0</segmented>
   <object>
      <name>buttons</name>
      <pose>Unspecified</pose>
      <truncated>0</truncated>
      <difficult>0</difficult>
      <bndbox>
         <xmin>83</xmin>
         <ymin>31.90625</ymin>
         <xmax>146</xmax>
         <ymax>71.40625</ymax>
      </bndbox>
   </object>
   <object>
      <name>switch</name>
      <pose>Unspecified</pose>
      <truncated>0</truncated>
      <difficult>0</difficult>
      <bndbox>
         <xmin>210.453125</xmin>
         <ymin>48.65625</ymin>
         <xmax>256.453125</xmax>
         <ymax>78.65625</ymax>
      </bndbox>
   </object>
   <object>
      <name>input</name>
      <pose>Unspecified</pose>
      <truncated>0</truncated>
      <difficult>0</difficult>
      <bndbox>
         <xmin>403.515625</xmin>
         <ymin>30.90625</ymin>
         <xmax>653.015625</xmax>
         <ymax>72.40625</ymax>
      </bndbox>
   </object>
   <object>
      <name>input</name>
      <pose>Unspecified</pose>
      <truncated>0</truncated>
      <difficult>0</difficult>
      <bndbox>
         <xmin>717.46875</xmin>
         <ymin>41.828125</ymin>
         <xmax>966.96875</xmax>
         <ymax>83.328125</ymax>
      </bndbox>
   </object>
</annotation>
```
This xml annotation file is mainly composed of the following parts：

- folder / filename: These two fields mainly define the image position and type corresponding to the annotation

- size: width and height of image
- object:
   - name: component category
   - bndbox: position of component


We have prepared such a data set, you can download it and check it out: [Download](http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/datasets/component-recognition-detection/component-recognition-detection.zip)

## Start Training
After the dataset is ready, we can start training. Using Pipcook can be very convenient for object detection training. You only need to build the pipeline like this,

```json
{
  "plugins": {
    "dataCollect": {
      "package": "@pipcook/plugins-object-detection-pascalvoc-data-collect",
      "params": {
        "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/pipcook/datasets/component-recognition-detection/component-recognition-detection.zip"
      }
    },
    "dataAccess": {
      "package": "@pipcook/plugins-coco-data-access"
    },
    "modelDefine": {
      "package": "@pipcook/plugins-detectron-fasterrcnn-model-define"
    },
    "modelTrain": {
      "package": "@pipcook/plugins-detectron-model-train",
      "params": {
        "steps": 100000
      }
    },
    "modelEvaluate": {
      "package": "@pipcook/plugins-detectron-model-evaluate"
    }
  }
}

```
Through the above plugins, we can see that they are used separately:

1. **@pipcook/plugins-object-detection-pascalvoc-data-collect** This plugin is used to download the dataset in Pascal Voc format. Generally, we need to provide the url parameter. We provide the address of the dataset we prepared above.
1. **@pipcook/plugins-coco-data-access** Now that we have downloaded the dataset, we need to connect the dataset into the format required by the subsequent model. Since the detectron2 framework used by our model requires the coco format, we use this plugin.
1. **@pipcook/plugins-detectron-fasterrcnn-model-define** We built a faster rcnn model based on the detectron2 framework. This model has a very good performance in the accuracy of object detection
1. **@pipcook/plugins-detectron-model-train** This plugin is used to start the training of all kinds of models built on detectron2. We set iteration to 100000. If your dataset is very complex, you need to increase the number of iterations.
1. **@pipcook/plugins-detectron-model-evaluate** We use this plug-in to evaluate the training effect of the model. This plugin will be effective only if the test testset is provided, and finally the average precision of each category is given.

Since the object detection model, especially the model of the rcnn family is very large, it needs to be trained on a machine prepared with nvidia GPU and cuda 10.1 environment:

```shell
$ pipcook run object-detection.json --verbose --tuna
```

The model will print out the loss of each iteration in real time during the training process. Please pay attention to the log to determine the model convergence:

```
[06/28 10:26:57 d2.data.build]: Distribution of instances among all 14 categories:
|   category   | #instances   |  category   | #instances   |  category  | #instances   |
|:------------:|:-------------|:-----------:|:-------------|:----------:|:-------------|
|     tags     | 3114         |    input    | 2756         |  buttons   | 3075         |
| imagesUpload | 316          |    links    | 3055         |   select   | 2861         |
|    radio     | 317          |  textarea   | 292          | datePicker | 316          |
|     rate     | 292          | rangePicker | 315          |   switch   | 303          |
|  timePicker  | 293          |  checkbox   | 293          |            |              |
|    total     | 17598        |             |              |            |              |

[06/28 10:28:32 d2.utils.events]:  iter: 0  total_loss: 4.649  loss_cls: 2.798  loss_box_reg: 0.056  loss_rpn_cls: 0.711  loss_rpn_loc: 1.084  data_time: 0.1073  lr: 0.000000  
[06/28 10:29:32 d2.utils.events]:  iter: 0  total_loss: 4.249  loss_cls: 2.198  loss_box_reg: 0.056  loss_rpn_cls: 0.711  loss_rpn_loc: 1.084  data_time: 0.1073  lr: 0.000000  
...
[06/28 12:28:32 d2.utils.events]:  iter: 100000  total_loss: 0.032 loss_cls: 0.122  loss_box_reg: 0.056  loss_rpn_cls: 0.711  loss_rpn_loc: 1.084  data_time: 0.1073  lr: 0.000000  
```

After the training is completed, output will be generated in the current directory, which is a brand-new npm package, then we first install dependencies:

```shell
$ cd output
$ BOA_TUNA=1 npm install
```

After installing the environment, we can start to predict:
First install dependencies:

```js
const predict = require('./output');
(async () => {
  const v1 = await predict('./test.jpg');
  console.log(v1); 
  // {
  //   boxes: [
  //   	[83, 31, 146, 71],  // xmin, ymin, xmax, ymax
  //     [210, 48, 256, 78],
  //     [403, 30, 653, 72],
  //     [717, 41, 966, 83]
  //   ],
  //   classes: [
  //   	0, 1, 2, 2  // class index
  //   ],
  //   scores: [
  //   	0.95, 0.93, 0.96, 0.99 // scores
  //   ]
  // }
})();
```
Note that the results given contain three parts:

- boxes: This property is an array, and each element is another array with four elements, namely xmin, xmax, ymin, ymax
- scores：This attribute is an array, and each element is the confidence of the corresponding prediction result
- classes：This attribute is an array, and each element is the corresponding predicted category

## Make your own dataset
After reading the above description, are you already ready to use object detection to solve your own problems? If you want to make your own data set, there are mainly the following steps

### Collect images
This step is easier to understand. To have your own training data, you need to find a way to collect enough training pictures. In this step, you don’t need to label your own pictures. You only need to mark the original pictures. it is good

### Labelling
There are many labeling tools now, you can use these labeling tools to mark which components are on your original picture, what the locations are and what types are of each component, Let's take [labelimg](https://github.com/tzutalin/labelImg) as example

![image.png](https://gw.alicdn.com/tfs/TB1nB4lN4z1gK0jSZSgXXavwpXa-799-401.png)

You can install the software from the official labelimg website above, and then follow the steps below:


- Build and launch using the instructions above.
- Click 'Change default saved annotation folder' in Menu/File
- Click 'Open Dir'
- Click 'Create RectBox'
- Click and release left mouse to select a region to annotate the rect box
- You can use right mouse to drag the rect box to copy or move it

### Training
After making the above data set, organize the file structure according to the introduction in the previous chapter. After that, you can start the pipeline for training.

## Conclusion
Readers have learned how to identify multiple front-end components in a image, which can be applied to some more general scenarios. So in an article, we will introduce a more interesting example, how to use Pipcook to achieve the transfer of picture style, such as replacing the oranges in the picture with apples, or replacing the realistic photo style with oil painting style.
