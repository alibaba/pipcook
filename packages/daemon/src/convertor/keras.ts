import * as path from 'path';
import * as fs from 'fs-extra';
import { GenerateOptions } from '../services/interface';
import { download } from '@pipcook/pipcook-core';
import { TVM_BUNDLE_PREFIX } from './constant';
import * as boa from '@pipcook/boa';

const { dict, len, open } = boa.builtins();
// @ts-ignore
let relay = null;
// @ts-ignore
let emcc = null;
// @ts-ignore
let keras = null;

try {
  relay = boa.import('tvm.relay');
} catch {
  console.error('Does not detect tvm environment here; Please try to use \n pipcook add tvm \n To fix it');
  throw new Error('tvm does not install');
}

try {
  emcc = boa.import('tvm.contrib.emcc');
} catch {
  console.error('Does not detect emscripten environment here; Please try to install emscripten');
  throw new Error('emscripten does not install');
}

try {
  keras = boa.import('tensorflow.keras');
} catch {
  console.error('Does not detect TensorFlow environment here; Please try to use \n pipcook add tensorflow \n To fix it');
  throw new Error('Tensorflow does not install');
}

export async function keras2wasm(dist: string, projPackage: any, opts: GenerateOptions, inputLayer?: string): Promise<void> {

  const fileQueue = [];

  fileQueue.push(download(`${TVM_BUNDLE_PREFIX}/dist/tvmjs.bundle.js`, path.join(dist, 'wasm', 'tvmjs.bundle.js')));
  await download(`${TVM_BUNDLE_PREFIX}/preload.js`, path.join(dist, 'wasm', 'preload.js'));

  // @ts-ignore
  const model = keras.models.load_model(path.join(opts.modelPath, 'model.h5'));

  const inputName = inputLayer ? inputLayer : 'input_1';
  const inputShape = model.layers[0].input_shape[0];
  if (len(inputShape) > 4) { return; }
  const shape = [ 1, inputShape[3], inputShape[1], inputShape[2] ];

  // @ts-ignore
  const [ mod, params ] = relay.frontend.from_keras(model, dict(boa.kwargs({ [inputName]: shape })));
  // @ts-ignore
  const [ graph, lib, param ] = relay.build(mod, boa.kwargs({
    params,
    target: 'llvm -mtriple=wasm32--unknown-emcc -system-lib'
  }));

  lib.save(path.join(dist, 'wasm', 'model.bc'));

  fileQueue.push(fs.writeFile(path.join(dist, 'wasm', 'modelDesc.json'), graph));

  const paramWriter = open(path.join(dist, 'wasm', 'modelParams.parmas'), 'wb');
  // @ts-ignore
  paramWriter.write(relay.save_param_dict(param));

  const emccConfig = [ '-O3', '-std=c++14', '-Wno-ignored-attributes', '-s', 'ALLOW_MEMORY_GROWTH=1',
                      '-s', 'STANDALONE_WASM=1', '-s', 'ERROR_ON_UNDEFINED_SYMBOLS=0', '-s', 'ASSERTIONS=1',
                      '--no-entry', '--pre-js', path.join(dist, 'wasm', 'preload.js') ];

  // @ts-ignore
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
    fs.copy(path.join(__dirname, `../../templates/wasm/`), `${dist}/wasm/`),
    // write package.json
    fs.outputJSON(dist + '/wasm/package.json', projPackage, { spaces: 2 })
  ]);

  await Promise.all(fileQueue);

  if (process.send) {
    process.send('done');
  }
}
