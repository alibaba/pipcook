# @pipcook/pipcook-plugins-image-detection-data-access

Access the target detection data. This plugin expects the data set in pascol voc format to enter and the data that is connected to the tf.data api to enter the downstream.


<a name="c8ad2b59"></a>
#### Pipcook plug-in Category:
Data Access

<a name="3d0a2df9"></a>
#### Parameter

- imgSize (number []): the image size. The image will be reset to a specific size. The default value is [224,224]. You need to pay attention to this attribute, many target detection models have special requirements for size.


<a name="8cb94eb1"></a>
#### Example

```typescript
const dataAccess = DataAccess(imageDetectionDataAccess);
```
