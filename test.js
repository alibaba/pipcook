const model = require('./packages/plugins/model-define/tensorflow-bert-ner-model-define').default;
const train = require('./packages/plugins/model-train/tensorflow-bert-ner-model-train').default;

async function test() {
  const unimodel = await model();
  await train(null, unimodel, {});
  console.log(unimodel)
}

test();