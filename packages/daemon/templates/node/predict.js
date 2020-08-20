'use strict';

const { pipeline, output } = require('./metadata.json');

function _requirePlugin(name) {
  const mod = require(pipeline[name]);
  if (mod && typeof mod.default === 'function') {
    return mod.default;
  }
  return mod;
}

const modelDefineModule = _requirePlugin('modelDefine');

let dataProcessModule;
if (typeof pipeline.dataProcess === 'string') {
  dataProcessModule = _requirePlugin('dataProcess');
}

const dataset = JSON.parse(output.dataset);
const modelDefine = modelDefineModule(null, {
  recoverPath: __dirname + '/model',
  dataset
});

let model;

async function predict(data) {
  if (!model) {
    model = await modelDefine;
  }
  let sample = { data, label: null };
  if (typeof dataProcessModule === 'function') {
    sample = await dataProcessModule(sample, {}, JSON.parse(pipeline.dataProcessParams));
  }
  return await model.predict(sample);
};

module.exports = predict;
