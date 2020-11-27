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
  "specVersion": "2.0",
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

### Add a `specVersion`

Add a version of a pipeline to flag it parser version, "1.0" will be the default version.

### `plugins` now is an array

An array is easy to extend than map, therefore what we want to change is modify the "plugins" type from
object/map to array which owns a `type` property to flag its plugin type.

Except for the types in 1.0, we supported some new types:

- `deploy` is for model deployment.

And we MUST support pipeline check based on the JSON schema as:

```json
{
  "$id": "http://alibaba.github.io/pipcook/pipeline-2.0.json",
  "$schema": "http://json-schema.org/draft-07/schema",
  "default": {},
  "description": "The root schema comprises the entire JSON document.",
  "examples": [
    {
      "specVersion": "2.0",
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
  ],
  "required": [
    "plugins"
  ],
  "title": "The JSON schema for Pipcook Pipeline.",
  "type": "object",
  "properties": {
    "specVersion": {
      "$id": "#/properties/version",
      "type": "string",
      "title": "The version schema",
      "description": "An explanation about the purpose of this instance.",
      "default": "",
      "examples": [
        "2.0"
      ]
    },
    "plugins": {
      "$id": "#/properties/plugins",
      "type": "array",
      "title": "The plugins schema",
      "description": "An explanation about the purpose of this instance.",
      "additionalItems": true,
      "items": {
        "$id": "#/properties/plugins/items",
        "anyOf": [
          {
            "$id": "#/properties/plugins/items/anyOf/0",
            "description": "An explanation about the purpose of this instance.",
            "examples": [
              {
                "type": "dataCollect",
                "package": "@pipcook/plugins-chinese-poem-data-collect",
                "params": {
                  "url": "foobar"
                }
              }
            ],
            "required": [
              "type",
              "package"
            ],
            "title": "plugin types",
            "type": "object",
            "properties": {
              "type": {
                "$id": "#/properties/plugins/items/anyOf/0/properties/type",
                "description": "An explanation about the purpose of this instance.",
                "examples": [
                  "dataCollect"
                ],
                "title": "The type schema",
                "enum": [
                  "dataCollect",
                  "dataAccess",
                  "dataProcess",
                  "datasetProcess",
                  "modelDefine",
                  "modelTrain",
                  "modelEvaluate",
                  "deploy"
                ],
                "type": "string"
              },
              "package": {
                "$id": "#/properties/plugins/items/anyOf/0/properties/package",
                "type": "string",
                "title": "The package uri of the plugin",
                "description": "An explanation about the purpose of this instance.",
                "default": "",
                "examples": [
                  "@pipcook/plugins-chinese-poem-data-collect"
                ]
              },
              "params": {
                "$id": "#/properties/plugins/items/anyOf/0/properties/params",
                "default": {},
                "description": "An explanation about the purpose of this instance.",
                "title": "The params of the plugin",
                "type": "object",
                "additionalProperties": true
              }
            },
            "additionalProperties": true
          }
        ]
      }
    }
  },
  "additionalProperties": true
}
```

# Adoption strategy

In 2.0, we are going to adapt to change it to the new pipeline syntax, however we still leave the 1.0
pipeline parser.

# Useful tools

- JSON Schema: https://jsonschema.net/home
