import * as boa from '@pipcook/boa';

interface InitReturnType {
  relay: any,
  emcc: any,
  keras: any
}

// @ts-ignore
export function initTVM(): InitReturnType {
  // @ts-ignore
  let relay = null;
  // @ts-ignore
  let emcc = null;
  // @ts-ignore
  let keras = null;

  try {
    relay = boa.import('tvm.relay');
  } catch {
    console.error('Does not detect tvm environment here; Please try to use \n pipcook lib tvm \n To fix it');
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
    console.error('Does not detect TensorFlow environment here; Please try to use \n pipcook lib tensorflow \n To fix it');
    throw new Error('Tensorflow does not install');
  }

  return { relay, emcc, keras };
}
