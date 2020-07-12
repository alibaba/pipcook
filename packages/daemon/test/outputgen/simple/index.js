'use strict';

const { pipeline, output } = require('./metadata.json');

function _requirePlugin(name) {
  let modPath = pipeline[name];
  let isInference = false;
  if (name === 'modelDefine') {
    try {
      require.resolve(`${modPath}/dist/inference.js`);
      modPath = `${modPath}/dist/inference.js`;
      isInference = true;
    } catch (e) {
      console.warn(`${modPath}/dist/inference.js doesn't exist, use ${modPath}.`);
    }
  }
  const mod = require(modPath);
  const plugin = {
    name,
    isInference,
    module: null
  };
  if (mod && typeof mod.default === 'function') {
    plugin.module = mod.default;
  } else {
    plugin.module = mod;
  }
  return plugin;
}

// load runtime plugins
const modelDefine = _requirePlugin('modelDefine');
let dataProcess;
if (typeof pipeline.dataProcess === 'string') {
  dataProcess = _requirePlugin('dataProcess');
}

let model;
const recoverPath = `${__dirname}/model`;
const dataset = JSON.parse(output.dataset);

async function loadModel() {
  if (model) {
    return model;
  }
  if (!modelDefine.isInference) {
    // compatible with the mixed way.
    model = await modelDefine.module(null, {
      recoverPath,
      dataset,
    });
  } else {
    // modelPath, { labelMaps, feature }
    model = await modelDefine.module(recoverPath, dataset);
  }
}

async function predict(data) {
  model = await loadModel();
  const sample = { data, label: null };
  if (dataProcess && typeof dataProcess.module === 'function') {
    await dataProcess.module(sample, {}, JSON.parse(pipeline.dataProcessParams));
  }
  return await model.predict(sample);
};

module.exports = predict;
