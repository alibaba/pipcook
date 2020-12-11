import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GenerateOptions } from '../service/pipeline';

const boa = require('@pipcook/boa');

export async function keras2Wasm(dist: string, projPackage: any, opts: GenerateOptions, inputLayer?: string) {
  const relay = boa.import('tvm.relay');
  const emcc = boa.import('tvm.contrib.emcc');
  const keras = boa.import('tensorflow.keras');
  const { dict, open, len } = boa.builtins();
  exec(`wget http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/dist/tvmjs.bundle.js`, {cwd: dist});
  exec(`wget http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/preload.js`, {cwd: dist});

  const model = keras.models.load_model(path.join(opts.modelPath, 'model.h5'));

  const inputName = inputLayer ? inputLayer : 'input_1';
  const inputShape = model.layers[0].input_shape[0];
  if (len(inputShape) > 4) { return ; }
  const shape = [1];
  shape.push(inputShape[3]);
  shape.push(inputShape[1]);
  shape.push(inputShape[2]);

  const [ mod, params ] = relay.frontend.from_keras(model, dict(boa.kwargs({[inputName]: shape})));
  const [ graph, lib, param ] = relay.build(mod, boa.kwargs({
    params,
    target: 'llvm -mtriple=wasm32--unknown-emcc -system-lib'
  }));

  lib.save(path.join(dist, 'tvm', 'model.bc'));

  const jsonWriter = open(path.join(dist, 'tvm', 'modelDesc.json'), 'w');
  jsonWriter.write(graph);
  const paramWriter = open(path.join(dist, 'tvm', 'modelParams.parmas'), 'wb');
  paramWriter.write(relay.save_param_dict(param));
  emcc.create_tvmjs_wasm(path.join(dist, 'tvm', 'model.wasi.js'), path.join(dist, 'tvm', 'model.bc'), boa.kwargs({
    options: ['-O3', '-std=c++14', '-Wno-ignored-attributes', '-s', 'ALLOW_MEMORY_GROWTH=1', '-s', 'STANDALONE_WASM=1', '-s', 'ERROR_ON_UNDEFINED_SYMBOLS=0', '-s', 'ASSERTIONS=1', '--no-entry', '--pre-js', path.join(dist, 'preload.js')]
  }));

  const templateHead = `function EmccWASI() {`;
  const templateTail = `
    this.Module = Module;
    this.start = Module.wasmLibraryProvider.start;
    this.imports = Module.wasmLibraryProvider.imports;
    this.wasiImport = this.imports['wasi_snapshot_preview1'];
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmccWASI;
  }
  `;

  const result = templateHead + open(path.join(dist, 'tvm', 'model.wasi.js')).read() + templateTail;
  const resultWriter = open(path.join(dist, 'tvm', 'model.wasi.js'), 'w');
  resultWriter.write(result);

  const fileQueue = [];

  const jsonPromise = fs.writeJSON(path.join(dist, 'tvm', 'modelSpec.json'), {
    shape,
    inputName
  });
  fileQueue.push(jsonPromise);
  fileQueue.concat([
    fs.copy(path.join(__dirname, `../../templates/wasm/predict.js`), `${dist}/tvm/index.js`),
    // write package.json
    fs.outputJSON(dist + '/tvm/package.json', projPackage, { spaces: 2 }),
  ]);

  await Promise.all(fileQueue);

  process.send('done');
}
