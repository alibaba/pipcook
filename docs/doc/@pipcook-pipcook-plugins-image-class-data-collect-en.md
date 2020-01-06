This plugin is used to collect images in the image classification pipeline and store them in a certain dataset format (pascol voc)

<a name="klNlr"></a>
#### Pipcook plugin Category:
Data Collect

<a name="xzxwP"></a>
#### Parameters:

- url (string): the path of the image. This path is required to point to a compressed file in zip format. The compressed file contains three folders: train, validation (optional), and test (optional). Each folder contains folders of all categories, each category folder contains your pictures. This url can be remote or local. If it is a local path, use file://${your path}
<a name="2e1Vr"></a>
#### Example:
When data compression files are stored remotely
```typescript
const dataCollect = DataCollect(imageClassDataCollect, {
   url: 'http://ai-sample.oss-cn-hangzhou.aliyuncs.com/image_classification/datasets/eCommerceImageClassification.zip'
});
```

When a compressed data file is stored locally

```typescript
const dataCollect = DataCollect(imageClassDataCollect, {
    url: 'file:///home/dataset/data.zip'
});
```

