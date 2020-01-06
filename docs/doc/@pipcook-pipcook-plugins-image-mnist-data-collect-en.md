# @pipcook/pipcook-plugins-image-mnist-data-collect

**This plugin is used to collect classic mnist handwritten datasets in the image classification pipeline and store them in a certain dataset format (pascol voc)

<a name="klNlr"></a>
#### Pipcook plug-in Category:
Data Collect

<a name="1ZMoY"></a>
#### Parameter

- trainingCount (number) [optional]: the number of images collected as a training set. The default value is 8000 images.
- testCount (number) [optional]: the number of images collected as a test set. The default value is 500 images.

<a name="zZyd7"></a>
#### Example
Collect 2000 pictures as the training set and 500 pictures as the test set

```typescript
const dataCollect = DataCollect(imageMnistDataCollection, {
  trainingCount:2000,
  testCount: 500
});
```
