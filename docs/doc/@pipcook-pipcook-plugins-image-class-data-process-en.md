# @pipcook/pipcook-plugins-image-class-data-process

The image classification data preprocessing plugin accepts image data streaming from the Access plug-in for image processing.

<a name="klNlr"></a>
#### Pipcook plugin Category:
Data Process

<a name="dHfzX"></a>
#### Parameter

- normalization (boolean) [optional]: a normalized Image. The default value is false.
- rotationRange (number) [optional]: randomly rotate the image. This attribute is the rotation range. For example, if it is 15, randomly rotate (-15, 15) degrees
- brightnessRange (number) [optional]: change the brightness of the image randomly. This attribute is the range of changes.

<a name="vE6A8"></a>
#### Example

```typescript
const dataAccess = DataProcess(imageClassDataProcess, {
  normalization: true,
  rotationRange: 15
});
```
