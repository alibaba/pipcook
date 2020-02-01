# @pipcook/pipcook-plugins-model-train

General-purpose tfjs model training. This plug-in will call the train interface of tfjs, expecting to pass in the tfjs model

<a name="klNlr"></a>
#### Pipcook plugin Category:
Model Train

<a name="2DhXZ"></a>
#### Parameter

- epochs (number) [optional]: how many rounds of training, the default is 10
- batchSize (number) [optional]: the number of samples in each batch. The default value is 32.
- shuffle (number) [optional]: the buffer size of the shuffle. The default value is 100

<a name="eiyJr"></a>
#### Example

```
const modelTrain = ModelTrain(imageClassModelTrain, {
  epochs: 15
});
```
