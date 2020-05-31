# Glossory

This glossary hopes to definitively represent the tacit and explicit conventions applied in Pipcook toolkit, while providing a reference for users and contributors. It aims to describe the concepts and either detail their corresponding API or link to other relevant parts of the documentation which do so. By linking to glossary entries from the API Reference and User Guide, we may minimize redundancy and inconsistency.

### Pipboard

The abbreviation of Pipcook board. On Pipboard, you can manage and operate your pipelines and plug-ins through the Web interface.

### Pipcook

The Pipcook project, generally https://github.com/alibaba/pipcook.

### Pipcook Daemon

It is actually responsible for the management and execution of Pipeline's components. It provides remote access to [Pipcook Tools][] and [Pipboard][] through HTTP, and also supports the ability of other clients to integrate Pipcook Daemon through HTTP.

### Pipcook Plugin

Plugins are Lego blocks in pipeline. By selecting different plugins, you can quickly complete different pipelines to train different models.

### Pipcook Tools

The abbreviation of Pipcook command-line tool, installed via `npm install @pipcook/pipcook-cli`.

### Pipeline

In computing, a pipeline, also known as a data pipeline, is a set of data processing elements connected in series, where the output of one element is the input of the next one. The elements of a pipeline are often executed in parallel or in time-sliced fashion.

[Pipcook Tools]: #pipcook-tools
[Pipboard]: #pipboard
