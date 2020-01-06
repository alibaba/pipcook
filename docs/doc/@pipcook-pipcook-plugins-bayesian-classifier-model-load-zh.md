# @pipcook/pipcook-plugins-bayesian-classifier-model-load

此插件用来加载传统机器学习-贝叶斯多分类器

<a name="klNlr"></a>
#### pipcook 插件类别：
Model Load

<a name="jOfHo"></a>
#### 参数

- modelName (string): 请指定一个在当前 pipeline 中唯一的一个模型名字，此名字主要是在如果多模型同时训练的 pipeline 中用于最后区分模型使用的
- modelPath (string)[可选]: 模型路径，您可以指定加载本地一个模型参数，这模型参数可能来自于您之前训练的结果。

<a name="mvTEu"></a>
#### 例子

```typescript
const modelLoad = ModelLoad(bayesianClassiferModelLoader, {
  modelName: 'testModelName'
});
```
