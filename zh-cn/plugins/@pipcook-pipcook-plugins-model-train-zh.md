# @pipcook/pipcook-plugins-model-train

通用的 tfjs 模型训练， 此插件将会调用 tfjs 的 train 接口，期待传入的是 tfjs 的模型

<a name="klNlr"></a>
#### pipcook 插件类别：
Model Train

<a name="2DhXZ"></a>
#### 参数

- epochs (number)[可选]: 训练多少个回合，默认为10
- batchSize (number)[可选]: 每批次包含的样本数量，默认为32
- shuffle (number)[可选]: shuffle 的 buffer 大小，默认为100

<a name="eiyJr"></a>
#### 例子

```
const modelTrain = ModelTrain(imageClassModelTrain, {
  epochs: 15
});
```

