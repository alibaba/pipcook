# ModelDeploy 插件

此插件将用来把训练好的模型部署到在线服务上，诸如阿里云 (eas服务等），Azure, Google Cloud 或亚马逊 Lambda 等。此插件应该能够获取之前管道中从数据预处理开始的过程，从而准确的在预测服务中处理数据，同时应该获取训练好的model，用来预测数据。 通过不同的 Model Deploy 插件，我们可以将模型部署到不同的云服务或者本地服务上去。

```typescript
export interface ModelDeployType extends PipcookPlugin {
  (args: ArgsType): Promise<any>
}
```

输入： 训练好的模型，预处理数据的插件<br />输出： 模型部署结果
