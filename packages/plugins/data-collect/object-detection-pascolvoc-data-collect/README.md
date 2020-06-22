# @pipcook/plugins-object-detection-pascalvoc-data-collect

### Description

This plugin is used to collect Pascal Voc data. For more information about this data format, please refer to [here](http://host.robots.ox.ac.uk/pascal/VOC/).
Notice that the url given by this plugin should be a zip file. The contents inside this zip file should have following structure:
You can download the file provided in example to check the correct dataset format.

- train
  - [pic1.jpg/png]
  - [pic1.xml]
  - [pic2.jpg/png]
  - [pic2.xml]
  - ...

- validation*
  - [pic1.jpg/png]
  - [pic1.xml]
  - [pic2.jpg/png]
  - [pic2.xml]
  - ...

- test*
  - [pic1.jpg/png]
  - [pic1.xml]
  - [pic2.jpg/png]
  - [pic2.xml]
  - ...


> \* means optional. you should provide pascal voc annotation file for each image


### Necessary Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
|url|string|Url or path of your zip file. If it's a local file, add prefix file://|

### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|

### Example
```json
"dataCollect": {
  "package": "@pipcook/plugins-object-detection-coco-data-collect",
  "params": {
    "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/autoLayoutGroupRecognition.zip"
  }
}
```
