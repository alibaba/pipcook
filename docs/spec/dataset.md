# Dataset

<a name="dq8p0"></a>
### Background
Data is an important part of deep learning. Subsequent models are built on the basis of datasets. We need to manage datasets. The following is the standard format of the dataset that pipcook should save after the Data is collected through the Data collection plug-in. Our Data Access layer assumes that the Data already meets the following specifications. For different dataset formats, data collection plug-ins are used to smooth the differences.

<a name="MFrf3"></a>
### Dataset specification
<a name="FfcZ1"></a>
#### Object detection/Image Classification
Pascal voc dataset format, detailed directory is as follows

- Root Directory (name should be the dataset name, such as mnist)
  - annotations
    - Train
      - ${image_name}.xml
      - ......
    - Test
    - validation
  - images
    - ${Image_name}.jpg
    - ......

For an xml description file, the format is

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<annotation>
  <folder>folder path</folder>
  <filename>image name</filename>
  <size>
    <width>width</width>
    <height>height</height>
  </size>
  <object>
    <name>category name</name>
    <bndbox> // this is not necessary for image classification problem
      <xmin>left</xmin>
      <ymin>top</ymin>
      <xmax>right</xmax>
      <ymax>bottom</ymax>
    </bndbox>
  </object>
</annotation>
```


<a name="HawJ6"></a>
#### Text Classification
The text category should be a csv file. The first column is the text content, and the second column is the category name. The delimiter is ',' without a header.
