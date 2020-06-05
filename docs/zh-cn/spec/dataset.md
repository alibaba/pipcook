# Dataset Specification

Dataset is an important part of machine learning. Subsequent models are built based on datasets. We need to manage datasets. The following is the standard format of the dataset that Pipcook should save after the data is collected through the `DataCollectType` plugin. Our `DataAccessType` layer assumes that the data already meets the following specifications. 

For different dataset formats, `DataCollectType` plugin is used to smooth the differences.

#### Image

PascalVOC Dataset format, the detailed directory is as follows:

```
📂dataset
   ┣ 📂annotations
   ┃ ┣ 📂train
   ┃ ┃ ┣ 📜...
   ┃ ┃ ┗ 📜${image_name}.xml
   ┃ ┣ 📂test
   ┃ ┗ 📂validation
   ┗ 📂images
     ┣ 📜...
     ┗ 📜${image_name}.jpg
```

Or representing in XML:

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

```csv
name, category
prod1, type1
prod2, type2
prod3, type2
prod4, type1
```
