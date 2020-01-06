This plugin is used to load traditional machine learning-Bayes multiple classifiers

<a name="klNlr"></a>
#### Pipcook plugin Category:
Model Load

<a name="jOfHo"></a>
#### Parameter

- modelName (string): specify a unique model name in the current pipeline. This name is mainly used to differentiate models in the pipeline where multiple models are trained simultaneously.
- modelPath (string) [optional]: The model path. You can specify to load a local model parameter. This model parameter may come from the result of your previous training.

<a name="mvTEu"></a>
#### Example

```typescript
const modelLoad = ModelLoad(bayesianClassiferModelLoader, {
  modelName: 'testModelName'
});
```
