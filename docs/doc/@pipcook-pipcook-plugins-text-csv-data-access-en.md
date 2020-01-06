Unified access to text classification data. This plugin accepts csv format data and sends it to downstream  as tf.data

<a name="klNlr"></a>
#### Pipcook plug-in Category:
Data Access

<a name="giDyb"></a>
#### Parameter

- hasHeader (boolean): indicates whether a csv header exists. The default value is false.
- delimiter (string): The csv delimiter. The default value is ','

<a name="4WAOj"></a>
#### Example

```typescript
const dataAccess = DataAccess(textClassDataAccess);
```
