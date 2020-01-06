此模型将会加载一个简单的包含5个卷积层的 CNN 网络，用于图片分类训练

<a name="klNlr"></a>
#### pipcook 插件类别：
Model Load

<a name="1n7Ru"></a>
#### 参数

- modelName (string): 请指定一个在当前 pipeline 中唯一的一个模型名字，此名字主要是在如果多模型同时训练的 pipeline 中用于最后区分模型使用的
- optimizer(string|[tf.train.Optimizer](https://js.tensorflow.org/api/latest/#class:train.Optimizer))[可选]：默认为tf.train.rmspops(0.0005, 1e-7) tensorflowJs的优化器，有关优化器的更多信息，请[参考这里](https://js.tensorflow.org/api/latest/#Training-Optimizers)
- loss (string|string[]|{[outputName: string]: string}|LossOrMetricFn| LossOrMetricFn[]|{[outputName: string]: LossOrMetricFn})[可选], 默认为 'categoricalCrossentropy' 有关更多损失函数的信息，请[参考这里](https://js.tensorflow.org/api/latest/#Training-Losses)
- metrics  (string|LossOrMetricFn|Array| {[outputName: string]: string | LossOrMetricFn}):[可选]: 默认为['accuracy'], 有关更多衡量指标，请[参考这里](https://js.tensorflow.org/api/latest/#Metrics)
- modelPath (string)[可选]: 模型路径，您可以指定加载本地一个模型参数，这模型参数可能来自于您之前训练的结果。


<a name="OH9Ct"></a>
#### 例子

```typescript
const modelLoad = ModelLoad(simpleCnnModelLoad, {
   modelName: 'test1'
});
```

