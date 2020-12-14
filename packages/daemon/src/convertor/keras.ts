import * as path from 'path';
import * as fs from 'fs-extra';
import { GenerateOptions } from '../service/pipeline';
import { download } from '@pipcook/pipcook-core/dist/utils/public';

const boa = require('@pipcook/boa');

export async function keras2Wasm(dist: string, projPackage: any, opts: GenerateOptions, inputLayer?: string): Promise<void> {
  const relay = boa.import('tvm.relay');
  const emcc = boa.import('tvm.contrib.emcc');
  const keras = boa.import('tensorflow.keras');
  const { dict, open, len } = boa.builtins();

  const fileQueue = [];

  fileQueue.push(download('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/dist/tvmjs.bundle.js', path.join(dist, 'tvmjs.bundle.js')));
  await download('http://ai-sample.oss-cn-hangzhou.aliyuncs.com/tvmjs/preload.js', path.join(dist, 'preload.js'));

  const model = keras.models.load_model(path.join(opts.modelPath, 'model.h5'));

  const inputName = inputLayer ? inputLayer : 'input_1';
  const inputShape = model.layers[0].input_shape[0];
  if (len(inputShape) > 4) { return; }
  const shape = [1];
  shape.push(inputShape[3]);
  shape.push(inputShape[1]);
  shape.push(inputShape[2]);

  const [ mod, params ] = relay.frontend.from_keras(model, dict(boa.kwargs({[inputName]: shape})));
  const [ graph, lib, param ] = relay.build(mod, boa.kwargs({
    params,
    target: 'llvm -mtriple=wasm32--unknown-emcc -system-lib'
  }));

  lib.save(path.join(dist, 'model.bc'));

  const jsonWriter = open(path.join(dist, 'modelDesc.json'), 'w');
  jsonWriter.write(graph);
  const paramWriter = open(path.join(dist, 'modelParams.parmas'), 'wb');
  paramWriter.write(relay.save_param_dict(param));
  emcc.create_tvmjs_wasm(path.join(dist, 'model.wasi.js'), path.join(dist, 'model.bc'), boa.kwargs({
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

  const result = templateHead + await (fs.readFile(path.join(dist, 'model.wasi.js'))) + templateTail;
  console.log(path.join(dist, 'modelSpec.json'))
  fileQueue.push(fs.writeFile(path.join(dist, 'model.wasi.js'), result));
  const jsonPromise = fs.writeJSON(path.join(dist, 'modelSpec.json'), {
    shape,
    inputName
  });
  fileQueue.push(jsonPromise);
  fileQueue.concat([
    fs.copy(path.join(__dirname, '../../templates/wasm/predictBrowser.js'), `${dist}/predictBrowser.js`),
    fs.copy(path.join(__dirname, '../../templates/wasm/predictNode.js'), `${dist}/predictNode.js`),
    // write package.json
    fs.outputJSON(dist + '/package.json', projPackage, { spaces: 2 }),
  ]);

  await Promise.all(fileQueue);

  process.send('done');
}
