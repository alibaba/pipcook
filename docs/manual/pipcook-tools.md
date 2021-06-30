# Pipcook Tools

Pipcook Tools is a command-line tool provided by Pipcook for developers. It can help you manage your pipelines.

## Installation

```sh
$ npm install @pipcook/cli -g
```

Follow [Install](../INSTALL.md) for other installation guide.


## User's Guide

To run a Pipeline from a URI, simply execute the following command.

```sh
$ pipcook run protocal://location/to/your/pipeline-config.json
```

The supported pipeline file protocols are: `http:`, `https:`, `file:`. `file:` is the default protocol if not defined.

More run options can be obtained with the following command:

```sh
$ pipcook run --help
```

> For more information on writing a pipeline, please see [here](./intro-to-pipeline.md).

## Cache Manage

When Pipeline run with the `pipcook run` command, if the script or framework is a non-file protocol, it will be
saved to a cache directory to speed up the next run.

If you want to remove these cache files manually, you can execute the following:
```sh
$ pipcook clean
```
