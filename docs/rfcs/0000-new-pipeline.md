- Start Date: 2020-11-18
- Target Major Version: 2.0
- Reference Issues: (leave this empty)
- Implementation PR: (leave this empty)
- Author: @yorkie

# Summary

Introducing a new Pipeline syntax for supporting:

- multiple nodes for the same plugin.
- reinforcement learning
- model deployment and distribution.

# Basic example

```json
{
  "version": "2.0",
  "plugins": [
    {
      "type": "dataCollect",
      "package": "@pipcook/plugins-chinese-poem-data-collect",
      "params": {
        "url": "foobar"
      }
    },
    {
      "type": "dataAccess",
      "package": "@pipcook/plugins-textline-data-access"
    },
    {
      "type": "dataProcess",
      "package": "@pipcook/plugins-textline-data-process",
      "params": {
        "arg1": "foobar"
      }
    },
    {
      "type": "dataProcess",
      "package": "@pipcook/plugins-textline-data-process",
      "params": {
        "arg2": "foobar"
      }
    },
    {
      "type": "modelDefine",
      "package": "@pipcook/plugins-tfjs-text-lstm-model-define"
    },
    {
      "type": "modelTrain",
      "package": "@pipcook/plugins-tfjs-text-lstm-model-train",
      "params": {
        "epochs": 200
      }
    },
    {
      "type": "modelEvaluate",
      "package": "@pipcook/plugins-tfjs-text-lstm-model-evaluate"
    },
    {
      "type": "deploy",
      "package": "@pipcook/plugins-nodejs-deploy-aws-ec2",
      "params": {
        "key": "..."
      }
    }
  ]
}
```

# Motivation

The 1.0 pipeline has limits to extend itself, thus the main change is to make the pipeline syntax more
extensible.

# Detailed design

### Add a `version`

Add a version of a pipeline to flag it parser version, "1.0" will be the default version.

### `plugins` now is an array

An array is easy to extend than map, therefore what we want to change is modify the "plugins" type from
object/map to array which owns a `type` property to flag its plugin type.

Except for the types in 1.0, we supported some new types:

- `deploy` is for model deployment.
- `rl.env` is for setting the environment on a reinforcement learning.

And we MUST support pipeline check based on the JSON schema.

# Adoption strategy

In 2.0, we are going to adapt to change it to the new pipeline syntax, however we still leave the 1.0
pipeline parser.
