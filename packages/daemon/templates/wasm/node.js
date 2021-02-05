const tvmjs = require('./tvmjs.bundle');
const EmccWASI = require('./model.wasi');
const fs = require('fs-extra');
const modelSpec = require('./modelSpec.json');
const graph = require('./modelDesc.json');

const loadModel = async () => {
  const wasmSource = await fs.readFile('./model.wasi.wasm');
  const paramsSource = await fs.readFile('./modelParams.parmas');
  const tvm = await tvmjs.instantiate(wasmSource, new EmccWASI());
  const param = new Uint8Array(paramsSource);
  const ctx = tvm.cpu(0);
  const sysLib = tvm.systemLib();
  model = tvm.createGraphRuntime(JSON.stringify(graph), sysLib, ctx);
  model.loadParams(param);
  return { model, tvm, ctx };
};

let model, tvm, ctx;

const predict = async (input) => {
  if (!model) {
    const rets = await loadModel();
    model = rets.model;
    tvm = rets.tvm;
    ctx = rets.ctx;
  }

  const inputData = tvm.empty(modelSpec.shape, 'float32', tvm.cpu());
  const output = model.getOutput(0);
  inputData.copyFrom(input);
  model.setInput(modelSpec.inputName, inputData);
  model.run();
  await ctx.sync();
  console.log(output.toArray());
  return output.toArray();
};

module.exports = predict;
