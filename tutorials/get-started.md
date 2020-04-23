# Get Started

This topic describes how to quickly train a machine learning model from examples.

## Environment Requirements

- Operating system: MacOs and Linux are supported
- Runtime Environment: Node. js> = 10.16, Npm> = 6.1.0
- Python >= 3.6

## Quick Start

### Local

First install the pipcook scaffold pipcook-cli, which provides environment initialization, control the start and end of the process, and view logs.

```sh
$ npm install -g @pipcook/pipcook-cli
```

After the scaffold is installed, you can create a project folder (or integrate it into any existing front-end project), and then use a few simple instructions of the scaffold to quickly generate a project.

```sh
$ mkdir pipcook-example && cd pipcook-example
$ pipcook init
```

At this point, all the relevant environments required by Pipcook have been installed. In addition, some examples  of the Pipcook project are generated for you.<br />You can directly run them to start a machine learning engineering pipeline. For example, you can quickly perform image classification recognition. To start this training, you only need a simple command

```sh
$ pipcook run examples/pipelines/mnist-image-classification.json
```

### Install via Docker

First install [Dockerfile](https://github.com/alibaba/pipcook/blob/master/Dockerfile).

Open Dockerfile's path and install image.

```sh
$ git clone https://github.com/alibaba/pipcook.git && cd pipcook
$ docker build -t alibaba/pipcook .
```

Check if the image is installed successfully.

```sh
$ docker images
REPOSITORY                                    TAG                 IMAGE ID            CREATED             SIZE
alibaba/pipcook                               latest              c297c73d62d4        7 hours ago         3.67GB
```

And run in the following command:

```sh
$ docker run -it --name pipcook_test alibaba/pipcook /bin/bash
```
