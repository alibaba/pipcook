# @pipcook/pipcook-plugins-simple-cnn-model-load

This model will load a simple CNN network containing 5 convolution layers , For image classification training

<a name="klNlr"></a>
#### Pipcook plugin Category:
Model Load

<a name="1n7Ru"></a>
#### Parameter

- modelName (string): specify a unique model name in the current pipeline. This name is mainly used to differentiate models in the pipeline where multiple models are trained simultaneously.
- optimizer (string|[tf.train.Optimizer](https://js.tensorflow.org/api/latest/#class:train.Optimizer))[Optional]: The default is tf. train. rmspops (0.0005, 1e-7) tensorflowJs Optimizer. For more information about the optimizer, see[Refer to here](https://js.tensorflow.org/api/latest/#Training-Optimizers)
- loss (string | string [] | {[outputName: string]: string} | LossOrMetricFn | LossOrMetricFn [] | {[outputName: string]: LossOrMetricFn}) [optional], the default value is 'categoricalcrossentropy '. For more information about loss functions, please [Refer to here](https://js.tensorflow.org/api/latest/#Training-Losses)
- metrics (string | LossOrMetricFn | Array | {[outputName: string]: string | LossOrMetricFn}): [optional]: The default value is ['accuracy ']. For more metrics, see [Refer to here](https://js.tensorflow.org/api/latest/#Metrics)
- modelPath (string) [optional]: The model path. You can specify to load a local model parameter. This model parameter may come from the result of your previous training.


<a name="OH9Ct"></a>
#### Example

```typescript
const modelLoad = ModelLoad(simpleCnnModelLoad, {
   modelName: 'test1'
});
```

