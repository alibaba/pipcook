# @pipcook/pipcook-plugins-image-detection-data-collect

This plugin is used to collect images in the target detection pipeline and store them in a certain dataset format (pascol voc)

<a name="c8ad2b59"></a>
#### Pipcook plugin Category:
Data Collect

<a name="0ae9da20"></a>
#### Parameters:

- url (string): the path of the image. This path is required to point to a compressed file in. zip format. This url can be remote or local. If it is a local path, use file://$ {your path} to compress the file. The file contains two folders: annotations and images. the annotations folder contains all xml annotations and images contain all images. For more information, see [Here](http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/componentRecognition.zip) Download the appropriate sample data for this plug-in
- validationSplit (number) [optional]: The default value is 0, 0-1, and how many proportions are divided into validation sets
- testSplit (number) [optional]: The default value is 0, 0-1, and how many ratios are divided into test sets

<a name="587da97d"></a>
#### Example:

When data compression files are stored remotely

```
const dataCollect = DataCollect(imageDetectionDataCollect, {
  url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/componentRecognition.zip',
  testSplit: 0.1
});
```

