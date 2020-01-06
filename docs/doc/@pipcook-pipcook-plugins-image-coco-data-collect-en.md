In many cases, we use the coco data format to store the target detection data. Our pipelines also support input in this format. This plug-in will collect the target detection data of coco data, and convert it into pascol voc format storage.

<a name="klNlr"></a>
#### Pipcook plug-in Category:
Data Collect

<a name="xzxwP"></a>
#### Parameters:

- url (string): the data path, which can be remote or local. To use the local path, you must add file: // before the path. The path must point to a zip compressed file that contains an image folder and a json annotation file, the image folder contains all the images. The annotation file is a coco format annotation. For more information about coco format, see [Here](https://www.immersivelimit.com/tutorials/create-coco-annotations-from-scratch)
- validationSplit (number) [optional]: 0-1. How many percent will be divided into validation sets
- testSplit (numer) [optional]: 0-1, how many percent will be divided into test sets
- annotationFileName (string) [optional]: The default value is annotation. json. The name of the annotation file in your compressed file.

<a name="2e1Vr"></a>
#### Example:

```typescript
const dataCollect = DataCollect(imageCocoDataCollect, {
    url: 'xxx',
    testSplit: 0.1,
    annotationFileName: 'annotation.json'
  });
```

