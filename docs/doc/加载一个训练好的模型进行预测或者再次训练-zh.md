# 加载一个训练好的模型进行预测或者再次训练

假设我们已经用 pipcook 的 pipeline 训练好了一个模型，我们或许想要直接加载训练好的模型。比如，我们训练好了图片分类模型，我们想要加载这个模型部署到本地进行预测。

代码如下：

```typescript
const {DataAccess, ModelLoad, PipcookRunner, ModelDeploy} = require('@pipcook/pipcook-core');

const imageClassDataAccess = require('@pipcook/pipcook-plugins-image-class-data-access').default;
const simpleCnnModelLoad = require('@pipcook/pipcook-plugins-simple-cnn-model-load').default;
const imageClassLocalModelDeploy = require('@pipcook/pipcook-plugins-image-class-local-model-deploy').default;


async function startPipeline() {
  // access mnist data into our specifiction
  const dataAccess = DataAccess(imageClassDataAccess, {
    imgSize:[28, 28],
  });

  // load mobile net model
  const modelLoad = ModelLoad(simpleCnnModelLoad, {
    modelName: 'test1',
    modelId: '1577784205203-test1'
  });

  // deploy to local
  const modelDeploy = ModelDeploy(imageClassLocalModelDeploy);

  const runner = new PipcookRunner('test1', {
    onlyPredict: true
  });

  runner.run([dataAccess, modelLoad, modelDeploy])
}

startPipeline();



```


需要注意的是，您需要将上面代码中模型加载插件中的 modelId 参数替换为您自己之前训练好的模型 id， 这个 id 可以在 pipcook board 中查看，如图：<br />![image.png](https://cdn.nlark.com/yuque/0/2019/png/654014/1577784838889-b2ec66bc-aa7b-43ad-87a0-088fa7d85516.png#align=left&display=inline&height=139&name=image.png&originHeight=278&originWidth=1722&size=94819&status=done&style=none&width=861)

此时，当命令好提示本地部署已经成功后，您可以直接像 localhost 发送请求进行预测，以下是我们的请求格式 (以 curl 为例），data 里的数据是所需要预测的图片 url 的数组

```typescript
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["https://img.alicdn.com/tfs/TB1RFVfrRv0gK0jSZKbXXbK2FXa-60-60.jpg"]
  }'
```

返回的 response

```typescript
{
    "status": true,
    "result": [
        "<prediction result>"
    ]
}
```

