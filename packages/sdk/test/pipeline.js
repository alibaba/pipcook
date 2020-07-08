const { test } = require('tap');
const { PipcookClient } = require('../');
const path = require('path');

test('pipeline api.pipeline test', async t => {
  const client = new PipcookClient('http://127.0.0.1', 6927);

  const name = 'bayes';
  const pipelineFile = path.join(__dirname, 'text-bayes-classification.json');
  const config = await readJson(pipelineFile);
  // prepare
  await client.job.remove();
  await client.pipeline.remove();
  // create
  let pipeline = await client.pipeline.create(config, { name });
  t.equal(typeof pipeline, 'object');
  t.equal(typeof pipeline.id, 'string');
  // list
  let pipelines = await client.pipeline.list();
  t.ok(Array.isArray(pipelines));
  t.strictEqual(pipeline.id, pipelines[0].id);
  // info
  t.strictEqual((await client.pipeline.info(pipeline.id)).name, name);
  // install
  await client.pipeline.install(pipeline.id, { tuna: true });

  // update
  pipeline = await client.pipeline.update(pipeline.id, config);
  // remove
  t.strictEqual(await client.pipeline.remove(pipeline.id), 1);
  pipelines = await client.pipeline.list();
  t.strictEqual(0, pipelines.length);

  t.end();
});
