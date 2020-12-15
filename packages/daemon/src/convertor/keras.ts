import * as path from 'path';
import * as fs from 'fs-extra';
import { GenerateOptions } from '../service/pipeline';
import { download } from '@pipcook/pipcook-core';
import { TVM_PREFIX } from './constant';

const boa = require('@pipcook/boa');

export async function keras2wasm(dist: string, projPackage: any, opts: GenerateOptions, inputLayer?: string): Promise<void> {
  const relay = boa.import('tvm.relay');
  const emcc = boa.import('tvm.contrib.emcc');
  const keras = boa.import('tensorflow.keras');
  const { dict, len } = boa.builtins();

  const fileQueue = [];

  fileQueue.push(download(`${TVM_PREFIX}/dist/tvmjs.bundle.js`, path.join(dist, 'wasm', 'tvmjs.bundle.js')));
  await download(`${TVM_PREFIX}/preload.js`, path.join(dist, 'wasm', 'preload.js'));

  const model = keras.models.load_model(path.join(opts.modelPath, 'model.h5'));

  const inputName = inputLayer ? inputLayer : 'input_1';
  const inputShape = model.layers[0].input_shape[0];
  if (len(inputShape) > 4) { return; }
  const shape = [1, inputShape[3], inputShape[1], inputShape[2]];

  const [ mod, params ] = relay.frontend.from_keras(model, dict(boa.kwargs({[inputName]: shape})));
  const [ graph, lib, param ] = relay.build(mod, boa.kwargs({
    params,
    target: 'llvm -mtriple=wasm32--unknown-emcc -system-lib'
  }));

  lib.save(path.join(dist, 'wasm', 'model.bc'));

  fileQueue.push(fs.writeFile(path.join(dist, 'wasm', 'modelDesc.json'), graph));
  fileQueue.push(fs.writeFile(path.join(dist, 'wasm', 'modelParams.parmas'), relay.save_param_dict(param)));

  const emccConfig = ['-O3', '-std=c++14', '-Wno-ignored-attributes', '-s', 'ALLOW_MEMORY_GROWTH=1',
                      '-s', 'STANDALONE_WASM=1', '-s', 'ERROR_ON_UNDEFINED_SYMBOLS=0', '-s', 'ASSERTIONS=1',
                      '--no-entry', '--pre-js', path.join(dist, 'wasm', 'preload.js')];
  emcc.create_tvmjs_wasm(path.join(dist, 'wasm', 'model.wasi.js'), path.join(dist, 'wasm', 'model.bc'), boa.kwargs({
    options: emccConfig
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

  const result = templateHead + await (fs.readFile(path.join(dist, 'wasm', 'model.wasi.js'))) + templateTail;
  fileQueue.push(fs.writeFile(path.join(dist, 'wasm', 'model.wasi.js'), result));
  fileQueue.push(
    fs.writeJSON(path.join(dist, 'wasm', 'modelSpec.json'), {
      shape,
      inputName
    })
  );
  fileQueue.concat([
    fs.copy(path.join(__dirname, '../../templates/wasm/'), path.join(dist, 'wasm')),
    // write package.json
    fs.outputJSON(dist + '/wasm/package.json', projPackage, { spaces: 2 })
  ]);

  await Promise.all(fileQueue);

  process.send('done');
}
