Assuming that we have trained a model with pipcook's pipeline, we may want to load the trained model directly. For example, after training the image classification model, we want to load the model and deploy it locally for prediction.

The code is as follows:

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


Note that you need to replace the modelId parameter in the model loading plug-in in the preceding code with your previously trained model id, which can be viewed in the pipcook board, as shown in the following figure:

![image.png](https://cdn.nlark.com/yuque/0/2019/png/654014/1577784838889-b2ec66bc-aa7b-43ad-87a0-088fa7d85516.png#align=left&display=inline&height=139&name=image.png&originHeight=278&originWidth=1722&size=94819&status=done&style=none&width=861)

After the command prompts that the local deployment has been successful, you can directly send a request for prediction like localhost. The following is our request format (take curl as an example ), the data in data is an array of image URLs to be predicted.

```typescript
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["https://img.alicdn.com/tfs/TB1RFVfrRv0gK0jSZKbXXbK2FXa-60-60.jpg"]
  }'
```

Response returned

```typescript
{
    "status": true,
    "result": [
        "<prediction result>"
    ]
}
```

