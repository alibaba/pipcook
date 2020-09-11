# Introduction to PipApp

> This function is experimental

PipApp can help developers from caring about complicated machine learning pipelines, so they can focus more on writing machine learning application logic, and it allows developers to better integrate traditional programming business logic and machine learning code.

## Preparation

Follow the [Pipcook Tools Initlization](./pipcook-tools.md#environment-setup) to get the PipApp ready.

## Quick Start

Let's start from an example:

```js
import { createLearnable, nlp } from '@pipcook/app';

const isProduct = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

const isBook = createLearnable(async function(sentence: string) {
  return (await nlp.classify(sentence));
});

(async () => {
  console.log(await isProduct('test'));
  console.log(await isBook('booking test'));
})();
```

Through the above example, first create a machine learning context through `createLearnable`, you can understand it as a special async function, and the API provided by PipApp can only be used in the `Learnable` function block.

We have created two machine learning blocks, in which both use `nlp.classify` to complete a text classification task.

> Note: In order to get enough information, PipApp requires TypeScript to write in.

### Project

Unlike running Pipeline, PipApp needs to create a complete project directory, so before we start, let's initialize a Node.js project.

```sh
$ npm init
$ npm install @pipcook/app --save
```

Because all APIs are in the `@pipcook/app` package, you need to add the dependency.

### Compile

After creating the project and completing the code, you can start to compile the project. Its main purpose is to analyze the project code and generate the corresponding Pipelines and project files.

```sh
$ pipcook app compile /path/to/your/project/script.ts
generated 2 pipelines, please click the following links to config them:
(nlp.classify) > https://pipboard.vercel.app/#/pipeline/info?pipelineId=1a287920-b10e-11ea-a743-792a596edff1
(nlp.classify) > https://pipboard.vercel.app/#/pipeline/info?pipelineId=1a287921-b10e-11ea-a743-792a596edff1
```

You can see that after executing the above command, you will be prompted to configure Pipeline, click on the link to configure them, the developer needs to configure different data according to different call interfaces, for example, the first classification is to classify products, then we when configuring Pipeline, we must prepare dataset related to product classification.

### Train

When the configuration is complete, save the Pipeline, and you can start training (note that here you must use the training entry of the command line tool to take effect).

```sh
$ pipcook app train /path/to/your/project/script.ts
```

During the training process, you can view the training progress on the Pipboard, or you can view it separately by the following command:

```sh
$ pipcook app status /path/to/your/project/script.ts
job(0acee5e0-b1e5-11ea-85a3-dbb717ca8e27):
  pipeline: https://pipboard.vercel.app/#/pipeline/info?pipelineId=1a287920-b10e-11ea-a743-792a596edff1
  status: success
  evaluate: {"pass":true,"accuracy":0.927570093457944}
job(0d043c70-b1e5-11ea-85a3-dbb717ca8e27):
  pipeline: https://pipboard.vercel.app/#/pipeline/info?pipelineId=1a287921-b10e-11ea-a743-792a596edff1
  status: success
  evaluate: {"pass":true,"accuracy":0.927570093457944}
```

### Build

When all models are trained, you can start building the final application package:

```sh
$ pipcook app build /path/to/your/project/script.ts
```

After the build is completed, the `{filename}.ml.js` will be generated in the directory and run using Node.js.

## Restrictions

Because PipApp is still an experimental feature, there are few open APIs. Currently, it only provides: text classification and image classification for everyone to try, and there are some restrictions:

Only use `createLearnable()` in root scope, for example:

```js
const foo = createLearnable(() => {
  const bar = createLearnable(...);
});
```

Reference calls to modules are not supported, such as:

```js
import { createLearnable, nlp } from '@pipcook/app';

const foo = createLearnable((s: string) => {
  const nlp2 = nlp;
  nlp2.classify(s);
});
```
