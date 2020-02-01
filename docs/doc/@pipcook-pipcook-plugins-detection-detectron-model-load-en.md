# @pipcook/pipcook-plugins-detection-detectron-model-load

We have officially built a facebook-based python target detection framework detectron2. this plug-in is used to load the model in the detectron2 training link and load the target detection model based on Faster RCNN.

<a name="klNlr"></a>
#### Pipcook plug-in Category:
Model Load

<a name="xzxwP"></a>
#### Parameters:

- device (string) [optional]: The default is cpu. If you want to use gpu, specify gpu
- modelId (string) [optional]: The default is the new model. If you want to use a model that has been trained by pipcook, specify the model id of pipcook.
- modelName (string): If the modelId is not specified, specify a name for the new model.

Example:

```
let detectronModelLoad = require('@pipcook/pipcook-plugins-detection-detectron-model-load').default;

const modelLoad = ModelLoad(detectronModelLoad, {
  modelName: 'test1'
});
```

