# @pipcook/plugins-image-classification-data-collect

### Description

This plugin is used to collect image classification dataset. 
Notice that the url given by this plugin should be a zip file. The contents inside this zip file should have following structure:

- train
  - [category1]
    - [pic1.jpg/png]
    - [pic2.jpg/png]
    - ...
  - [category2]
  - ....
- validation*
   - [category1]
      - [pic1.jpg/png]
      - [pic2.jpg/png]
      - ...
  - [category2]
  - ....
- test*
   - [category1]
      - [pic1.jpg/png]
      - [pic2.jpg/png]
      - ...
  - [category2]
  - ....


> \* means optional. [category] should be replaced by your category. You should put all your images of this category into specific category folder.


### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
|url|string|Url or path of your zip file. If it's a local file, add prefix file://|

### Optional Parameters

| Parameter | Type | Default Value | Description |
|:----------|:-----|:------|:-----|


### Example
```json
"dataCollect": {
  "package": "@pipcook/plugins-image-classification-data-collect",
  "params": {
    "url": "http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip"
  }
},
```
