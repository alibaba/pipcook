import * as tvmjs from './tvmjs.bundle';
import * as EmccWASI from './model.wasi';

const loadModel = async () => {
  const reqList = [ fetch('./modelSpec.json'), fetch('./modelDesc.json'), fetch('./model.wasi.wasm'), fetch('./modelParams.parmas') ];
  const [ spec, desc, wasmSource, params ] = await Promise.all(reqList);
  const wasm = await wasmSource.arrayBuffer();
  let param = await params.arrayBuffer();
  const graph = await desc.json();
  const modelSpec = await spec.json();
  const tvm = await tvmjs.instantiate(wasm, new EmccWASI());
  param = new Uint8Array(param);
  const ctx = tvm.cpu(0);
  const sysLib = tvm.systemLib();
  model = tvm.createGraphRuntime(JSON.stringify(graph), sysLib, ctx);
  model.loadParams(param);
  return { model, tvm, ctx, modelSpec };
}

let model, tvm, ctx, modelSpec;

const predict = async (input) => {
  if (!model) {
    const rets = await loadModel();
    model = rets.model;
    tvm = rets.tvm;
    ctx = rets.ctx;
    modelSpec = rets.modelSpec;
  }

  const inputData = tvm.empty(modelSpec.shape, 'float32', tvm.cpu());
  const output = model.getOutput(0);
  inputData.copyFrom(input);
  model.setInput(modelSpec.inputName, inputData);
  model.run();
  await ctx.sync();
  console.log(output.toArray());
  return output.toArray();
}

export {
  predict
}
