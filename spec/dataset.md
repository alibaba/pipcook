# Dataset Specification

## Background

Data is an important part of deep learning. Subsequent models are built on the basis of datasets. We need to manage datasets. The following is the standard format of the dataset that pipcook should save after the Data is collected through the Data collection plug-in. Our Data Access layer assumes that the Data already meets the following specifications. For different dataset formats, data collection plug-ins are used to smooth the differences.

## Data Types

#### Image

Pascal VOC Dataset format, detailed directory is as follows:

- dataset root directory (name should be the dataset name, such as *mnist*)
  - annotations
    - Train
      - ${image_name}.xml
      - ......
    - Test
    - validation
  - images
    - ${Image_name}.jpg
    - ......

or an XML description file:

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
    <bndbox> <!--this is not necessary for image classification problem-->
      <xmin>left</xmin>
      <ymin>top</ymin>
      <xmax>right</xmax>
      <ymax>bottom</ymax>
    </bndbox>
  </object>
</annotation>
```

#### Text

The text category should be a CSV file. The first column is the text content, and the second column is the category name. The delimiter is ',' without a header.

