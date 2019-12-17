# pipcook

With the mission of enabling front-end engineers to utilize the power of machine learning without any prerequisites and the vision to lead front-end technical field to the intelligentization, pipcook has become the one-step front-end algorithm platform from processing data to deploying models. Pipcook is focused on the front-end area and developed from the front-end developers' view. With the principle of being friendly for web developers, pipcook will push the whole area forward with the engine of machine learning.

## Quick Start

- Environment: Node.js >= 10.16, Npm >= 6.1
- Python: python >= 3.6 with correct pip installed (This is required if you want to use pipcook-python-node. For more info, check [here](https://github.com/alibaba/pipcook/wiki/%E6%83%B3%E8%A6%81%E4%BD%BF%E7%94%A8python%EF%BC%9F))

We recommend to install pipcook-cli to manage pipcook projects:
```
sudo npm install -g pipcook-cli
```

You can initialize a pipcook project with just a few commands:
```
mkdir pipcook-example && cd pipcook-example
pipcook init
cd pipcook-example
```

## Documentation

Please refer to [this link](https://github.com/alibaba/pipcook/wiki/Pipcook-%E6%98%AF%E4%BB%80%E4%B9%88%EF%BC%9F) to check the full documentation.


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