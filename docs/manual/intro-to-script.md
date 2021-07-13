# Pipcook Scripts

In Pipcook, each Pipeline represents a specific machine learning task, so how do we define a workflow? Pipcook uses scripts to define and configure the different phases in a Pipeline. A Pipcook script is a js script file that exports a specific method and contains 3 different types: `datasource`, `dataflow` and `model`, as defined [here] (... /spec/script.md). A text classification task, for example, could be composed with the following script.

- `datasource` The datasource script is used to download the sample data and provide the data access interface.
- `dataflow` converts the format of the downloaded dataset to a format acceptable to the model that follows (not needed in this example).
- `model` Define the model for text classification, [plain Bayesian classifier](https://en.wikipedia.org/wiki/Naive_Bayes_classifier), obtain samples for model training and evaluate accuracy through the sample data interface.

> The source code of the above Pipeline is defined in [here](https://github.com/alibaba/pipcook/blob/main/example/pipelines/bayes.v2.json).

With the above example, for a text classifier task, we follow a machine learning workflow which executes in order of different types of subtasks, and each subtask corresponds to a user-defined plug-in, while the user can also quickly tune the Pipeline for the whole task at a lower cost.

> The available official scripts are [here](https://github.com/imgcook/pipcook-script).
