# Quick Start

## Installation from npm

You can use either the npm cli tool or yarn to install pipcook:

```bash
yarn add @pipcook/cli -g
```

or

```bash
npm install @pipcook/cli -g
```


## Run your first pipeline task

In the following steps, we will demonstrate how to start a machine learning pipeline task in pipcook taking an image classification task as example. 

## Setup Pipeline File

In pipcook framework, a typical machine learning process can be split into three steps: `data access`, `data processing` and `model training`. the output of each step will be the input of the next step. All these steps are described by script files and combined in one pipeline config file. 

In our case, the pipeline config file is as following. Here you don't need to go deep into detail since we have already prepared the related scripts for you. Roughly speaking:

In dataScource part, we specified the image data source for the classification task; In dataflow part, we specified the data process code which converts the original image input into a data format usable by the pipcook model;In model part, we sepecied the mode code which uses [mobileNet][1] to classify image data. 

If you want to know how to write scripts please [Click Here][2]. 

More detailed information about pipeline config file can be find here.

```
{
  "specVersion": "2.0",
  "dataSource": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-image-classification-collector@d00337c/build/script.js?url=http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/imageclass-test.zip",
  "dataflow": [
    "https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-process-tfjs-image-classification@db14a1a/build/script.js?size=224&size=224"
  ],
  "model": "https://cdn.jsdelivr.net/gh/imgcook/pipcook-plugin-tfjs-mobilenet-model@a95d0de/build/script.js",
  "options": {
    "framework": "mobilenet@1.0.0",
    "train": {
      "epochs": 100,
      "validationRequired": true
    }
  }
}
```

## Run Pipeline Task


After settting up the pipeline config file, you can run the pipeline task through pipcook command.

```bash
pipcook run ${your pipeline path}/pipeline.json
```

Model output will be saved in `${YOUR_CURRENT_PATH}/${TIME_STAMP}/model/model.json`


  [1]: https://arxiv.org/abs/1704.04861
  [2]: click