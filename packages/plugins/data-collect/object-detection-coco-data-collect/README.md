# @pipcook/plugins-object-detection-coco-data-collect

### Description

This plugin is used to collect coco data. For more information about coco data format, please refer to [here](http://cocodataset.org/).
Notice that the url given by this plugin should be a zip file. The contents inside this zip file should have following structure:
You can download the file provided in example to check the correct dataset format.

- train
  - annotation.json
  - [pic1.jpg/png]
  - [pic2.jpg/png]
  - ...

- validation*
  - annotation.json
  - [pic1.jpg/png]
  - [pic2.jpg/png]
  - ...

- test*
  - annotation.json
  - [pic1.jpg/png]
  - [pic2.jpg/png]
  - ...


> \* means optional. you should provide coco-data annotation file for train/test/validation separately.


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
