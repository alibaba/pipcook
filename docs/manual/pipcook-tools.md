# Pipcook Tools

Pipcook Tools is a command-line tool provided by Pipcook for developers. It can help you manage your local pipelines and plugins, and allows you to easily define, train, and optimize your models.

## Installation

```sh
$ npm install @pipcook/pipcook-cli -g
```

Follow [Install](../INSTALL.md) for other installation guide.

## Environment Setup

After the installation of Pipcook Tools, it also needs to execute the initialization command. After the initialization operation, it will download [Pipcook Daemon][] and [Pipboard][] to the local, and then manually start Pipcook Daemon as follows:

```sh
$ pipcook init
$ pipcook daemon start
```

To use [tuna mirror](https://mirrors.tuna.tsinghua.edu.cn/) for Python installation:

```sh
$ pipcook init --tuna
```

We can specify the version:

```sh
$ pipcook init 1.1.0
```

Or use `--beta` to install the beta version:

```sh
$ pipcook init --beta
```

After executing the above initialization commands and starting the daemon, you can start using Pipcook, let's start with some simple introductions.

**WASM:** To enable wasm export, users need to manually install and activate `emscripten` on theirselves. The detailed installation manual could be found [here](https://emscripten.org/docs/getting_started/downloads.html).

We will try to metigate the gap and abstract the operations within our system in the coming release.

## Pipeline Usage

To run a pipeline from a config file, just type the following command:

```sh
$ pipcook run path/to/your/pipeline-config.json
```

> For the writing of the pipeline, you can refer to [here](./intro-to-pipeline.md).

In the above example, each execution of the command will create a new pipeline row, which is usually not conducive to our later iteration and visualization based on the same pipeline. Then you can use the subcommand `pipcook-job(1)`:

```sh
$ pipcook job run <pipeline id>
```

The above command will execute the task from an already created Pipeline to avoid repeated creation of pipelines. So what if you want to manually create a pipeline without directly executing it?

```sh
$ pipcook pipeline create path/to/your/pipeline-config.json
```

After creation, you can view all pipelines through the `list` subcommand:

```sh
$ pipcook pipeline list
┌─────────┬────────────────────────────────────────┬──────┬────────────────────────────┬────────────────────────────┐
│ (index) │                   id                   │ name │         updatedAt          │         createdAt          │
├─────────┼────────────────────────────────────────┼──────┼────────────────────────────┼────────────────────────────┤
│    0    │ 'c0432b50-a1ed-11ea-9209-9723e386c9d5' │ null │ '2020-05-29T20:48:29.318Z' │ '2020-05-29T20:48:29.318Z' │
│    1    │ '94aa20c0-a1ed-11ea-a602-6d2f8632b52c' │ null │ '2020-05-29T20:47:16.172Z' │ '2020-05-29T20:47:16.172Z' │
│    2    │ '9c485630-a1cf-11ea-a602-6d2f8632b52c' │ null │ '2020-05-29T17:12:44.052Z' │ '2020-05-29T17:12:44.052Z' │
└─────────┴────────────────────────────────────────┴──────┴────────────────────────────┴────────────────────────────┘
```

You can also view the JSON of the pipeline through the `info` subcommand:

```sh
$ pipcook pipeline info <id>
{
  "plugins": {
    "dataCollect": {
      "package": "./packages/plugins/data-collect/object-detection-coco-data-collect",
      "params": {
        "url": "http://foobar"
      }
    },
    "dataAccess": {
      "package": "./packages/plugins/data-access/coco-data-access",
      "params": {}
    },
    "modelDefine": {
      "package": "./packages/plugins/model-define/detectron-fasterrcnn-model-define",
      "params": {}
    },
    "modelTrain": {
      "package": "./packages/plugins/model-train/object-detection-detectron-model-train",
      "params": {
        "steps": 1
      }
    },
    "modelEvaluate": {
      "package": "./packages/plugins/model-evaluate/object-detection-detectron-model-evaluate",
      "params": {}
    }
  }
}
```

remove pipeline via pipeline id or `all`, this operation will remove jobs which belong to the pipeline too:

```sh
$ pipcook pipeline remove 42lw3pir   
? 1 job which belong to the pipeline will be removed too, continue? Yes
ℹ 1 job removed.
```

```sh
$ pipcook pipeline remove all
? 1 job which belong to the pipeline will be removed too, continue? Yes
ℹ 1 jobs removed.
✔ all pipelines removed.
```

## Plugins Management

Generally, when creating a pipeline through the above `pipcook-pipeline(1)`, the missing plugin will be installed by default, but you can also manually manage the local plugin through `pipcook-plugin(1)`.

First, get the installed list through the `list` subcommand:

```sh
$ pipcook plugin list
┌─────────┬────────────┬────────────────────────────────────────────┬─────────┬─────────────────┬──────────┬─────────────┐
│ (index) │     id     │                    name                    │ version │    category     │ datatype │   status    │
├─────────┼────────────┼────────────────────────────────────────────┼─────────┼─────────────────┼──────────┼─────────────┤
│    0    │ '6lfansw6' │    '@pipcook/plugins-csv-data-collect'     │ '1.1.0' │  'dataCollect'  │  'text'  │ 'installed' │
│    1    │ 'mca2mysb' │     '@pipcook/plugins-csv-data-access'     │ '1.1.0' │  'dataAccess'   │  'text'  │ 'installed' │
│    2    │ 'wbpggj0m' │  '@pipcook/plugins-bayesian-model-define'  │ '1.1.0' │  'modelDefine'  │  'text'  │ 'installed' │
│    3    │ 'm65a6t7o' │  '@pipcook/plugins-bayesian-model-train'   │ '1.1.0' │  'modelTrain'   │  'text'  │ 'installed' │
│    4    │ 'nz0iuobj' │ '@pipcook/plugins-bayesian-model-evaluate' │ '1.1.0' │ 'modelEvaluate' │  'text'  │ 'installed' │
│    5    │ 'asdorgj1' │  '@pipcook/plugins-pascalvoc-data-access'  │ '1.1.0' │  'dataCollect'  │ 'image'  │ 'installed' │
└─────────┴────────────┴────────────────────────────────────────────┴─────────┴─────────────────┴──────────┴─────────────┘
```

You can query a plugin detail:
```sh
$ pipcook plugin info 6lfansw6
{
  "id": "6lfansw6",
  "name": "@pipcook/plugins-csv-data-collect",
  "version": "1.1.0",
  "category": "dataCollect",
  "datatype": "text",
  "namespace": null,
  "dest": "/path/to/.pipcook/plugins/node_modules/@pipcook/plugins-csv-data-collect@1.1.0",
  "sourceFrom": "npm",
  "sourceUri": "https://registry.npmjs.com/@pipcook/plugins-csv-data-collect",
  "status": 1,
  "error": null,
  "createdAt": "2020-09-01T05:59:21.286Z",
  "updatedAt": "2020-09-01T05:59:29.334Z"
}
```

Then you can uninstall the above plugin via the following:

```sh
$ pipcook plugin uninstall @pipcook/plugins-csv-data-access
```

Install a new plugin via NPM:

```sh
$ pipcook plugin install @pipcook/plugins-csv-data-access
```

Install a new plugin from a local path

```sh
$ pipcook plugin install /path/to/dir/of/your/plugin
```

Install a new plugin from git via ssh

```sh
$ pipcook plugin install git+ssh://git@some.git.com/my-git-repo.git
```

Note: when installing a plugin, you must ensure that this package of plugin complies with our plugin specification.

## Daemon Management

[Pipcook Daemon][] is a process executed in the background, which helps users manage local pipelines and plugins. What if we manage it through the command line?

To start or restart the daemon:

```sh
$ pipcook daemon start
$ pipcook daemon restart
```

To stop the currently running daemon:

```sh
$ pipcook daemon stop
```

Check out the daemon logs via:

```sh
$ cat `pipcook daemon logfile`
```

To monit the daemon process, run the following command:

```sh
$ pipcook daemon monit
```

To start the daemon process in foreground mode for debugging:

```sh
$ pipcook daemon debug
```

This will run the daemon service in the current process, and it would be shutdown after the Pipcook Tools session is end.

[Pipcook Daemon]: ../GLOSSORY.md#pipcook-daemon
[Pipboard]: ../GLOSSORY.md#pipboard