const { test } = require('tap');
const { API } = require('../');
const path = require('path');

test('pipeline api.pipeline test', async t => {
  const api = new API('http://127.0.0.1', 6927);

  const name = 'bayes';
  const pipelineFile = path.join(__dirname, 'text-bayes-classification.json');

  // prepare
  await api.job.remove();
  await api.pipeline.remove();
  // create
  let pipeline = await api.pipeline.create(pipelineFile, { name });
  t.equal(typeof pipeline, 'object');
  t.equal(typeof pipeline.id, 'string');
  // list
  let pipelines = await api.pipeline.list();
  t.ok(Array.isArray(pipelines));
  t.strictEqual(pipeline.id, pipelines[0].id);
  // info
  t.strictEqual((await api.pipeline.info(pipeline.id)).name, name);
  // install
  await api.pipeline.install(pipeline.id, { tuna: true });

  // update
  pipeline = await api.pipeline.update(pipeline.id, pipelineFile);
  // remove
  t.strictEqual(await api.pipeline.remove(pipeline.id), 1);
  pipelines = await api.pipeline.list();
  t.strictEqual(0, pipelines.length);

  t.end();
});
