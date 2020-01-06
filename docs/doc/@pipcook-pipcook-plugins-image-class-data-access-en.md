Access Image Classification data. This plugin expects the data set in pascol voc format to enter and the data that is connected to tf.data api to go downstream.

<a name="klNlr"></a>
#### Pipcook plug-in Category:
Data Access

<a name="YN9Jh"></a>
#### Parameter

- imgSize (number []): the image size. The image will be reset to a specific size. The default value is [128,128]

<a name="FZx0K"></a>
#### Example
Unified the upstream data set into 28*28 Size

```typescript
const dataAccess = DataAccess(imageClassDataAccess, {
  imgSize:[28, 28],
});
```
