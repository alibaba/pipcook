# pipcook

With the mission of enabling front-end engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligentization, pipcook has become the one-step front-end algorithm platform from processing data to deploying models. Pipcook is focused on the front-end area and developed from the front-end developers' view. With the principle of being friendly for web developers, pipcook will push the whole area forward with the engine of machine learning. We are named 'pipcook' since our platform is based on pip (pipeline) and we also want to include the python ecosystem (python PyPI)

## Quick Start

- Environment: Node.js >= 10.16, Npm >= 6.1
- Python: python >= 3.6 with correct pip installed (This is required if you want to use pipcook-python-node. 

We recommend to install pipcook-cli to manage pipcook projects:
```
sudo npm install -g @pipcook/pipcook-cli
```

You can initialize a pipcook project with just a few commands:
```
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-project
```

note: if you use some client other than npm, such as cnpm (taobao mirror), you can specify client by
```
pipcook init -c cnpm
```

## Documentation

Please refer to [中文](https://alibaba.github.io/pipcook/doc/pipcook%20%E6%98%AF%E4%BB%80%E4%B9%88-zh)｜ [english](https://alibaba.github.io/pipcook/doc/What%20is%20Pipcook%3F-en)


## Run your first pipcook pipeline
In the initialized folder, we have prepared several samples for you, They are:

- pipeline-mnist-image-classification: pipeline for classific Mnist image classification problem.
- pipeline-databinding-image-classification: pipeline example to train the iamge classification task which is to classifify [imgcook](https://www.imgcook.com/) databinding pictures.
- pipeline-object-detection: pipeline example to train object detection task which is for component recognition used by imgcook
- python-keras: example to use Python Keras library to train deep leraning network in js syntax and runtime

For example, you can quickly run the pipeline to do a mnist image classification. To start the pipeline, just run:
```
node examples/pipeline-mnist-image-classification.js
```

## How to contribute

Please make sure you have installed Typescript and Lerna. To check, run the following commands:
```
lerna -v
tsc -v
```

First, clone the repository. Then, to bootstrap the lerna project (install all dependencies for npm packages), run:
```
lerna bootstrap
```
Please focus on the codes in `src` directory. Each time after you change something, run below command to compile codes:
```
lerna run compile
```

## RoadMap
 <img  src="https://img.alicdn.com/tfs/TB1qsKJtkT2gK0jSZFkXXcIQFXa-824-1178.jpg"  width="400"  height="580">