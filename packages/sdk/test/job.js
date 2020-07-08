const { test } = require('tap');
const { API } = require('../');
const path = require('path');

test('pipeline api.job test', async t => {
  const api = new API('http://localhost', 6927);
  // prepare
  await api.job.remove();
  await api.pipeline.remove();
  const name = 'bayes-job-test';
  const pipelineFile = path.join(__dirname, 'text-bayes-classification.json');
  //create pipeline
  let pipeline = await api.pipeline.create(pipelineFile, { name });
  t.equal(typeof pipeline, 'object');
  t.equal(typeof pipeline.id, 'string');
  // create job
  const jobObj = await api.job.run({pipelineId: pipeline.id, tuna: true});
  t.equal(typeof jobObj, 'object');
  t.equal(typeof jobObj.id, 'string');

  // info
  const jobInfoObj = await api.job.info(jobObj.id);
  t.equal(typeof jobInfoObj, 'object');
  t.equal(typeof jobInfoObj.id, 'string');
  // stop
  if (jobInfoObj.status === 1) {
    await api.job.stop(jobInfoObj.id);
  }
  await api.job.remove(jobObj.id);
  await api.pipeline.remove(pipeline.id);
  t.end();
});
