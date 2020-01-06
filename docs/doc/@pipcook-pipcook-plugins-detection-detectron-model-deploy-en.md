This plugin is used to deploy the detectron2 object detection model locally, start a local server, and return the corresponding prediction results.

<a name="Ej4GX"></a>
#### Pipcook plug-in category
Model Deploy

<a name="vGyBc"></a>
#### Parameter

- No

<a name="ZZcV2"></a>
#### Example:

```typescript
const detectronModelEvaluate = require('@pipcook/pipcook-plugins-detection-detectron-model-evaluate').default;
const modelEvaluate = ModelEvaluate(detectronModelEvaluate);

```

<a name="9NElt"></a>
#### Notice
For our local deployment, the following is our request format (take curl as an example). The data is an array of image URLs to be predicted.
```typescript
curl -X POST \
  http://127.0.0.1:7778/predict \
  -H 'Content-Type: application/json' \
  -H 'Host: 127.0.0.1:7778' \
  -d '{
    "data": ["https://img.alicdn.com/tfs/TB1RFVfrRv0gK0jSZKbXXbK2FXa-60-60.jpg"]
  }'
```

Output

```typescript
{
    "status": true,
    "result": [
        "<prediction result>"
    ]
}
```

