# @pipcook/pipcook-plugins-text-class-local-model-deploy

This plug-in is used to deploy the text classification model locally, start a local server, and return the corresponding prediction results.

<a name="Ej4GX"></a>
#### Pipcook plug-in category
Model Deploy

<a name="vGyBc"></a>
#### Parameter

- No

<a name="ZZcV2"></a>
#### Example:

```
const textClassLocalModelDeploy = require('@pipcook/pipcook-plugins-text-class-local-model-deploy').default;
const modelDeploy = ModelDeploy(textClassLocalModelDeploy);
```

<a name="9NElt"></a>
#### Notice
For our locally deployed links, the following is our request format (take curl as an example). The data in data is an array of text to be predicted.

```
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["this is an apple"]
  }'
```

Output

```
{
    "status": true,
    "result": [
        "<prediction result>"
    ]
}
```

