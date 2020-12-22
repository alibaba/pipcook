import { keras2wasm } from '../convertor/keras';

const validModel = ['keras'];

const inputModel = process.argv[process.argv.length - 1];
if (validModel.includes(inputModel)) {
  const { dist, projPackage, opts, inputLayers = '' } = JSON.parse(process.argv[process.argv.length - 2]);
  if (inputModel === 'keras') {
    try{
      keras2wasm(dist, projPackage, opts, inputLayers);
    } catch(e) {
      console.error(e);
    }
  }
} else {
  console.error(`The convert type is ${inputModel} but only ${validModel.join(', ')} are available`);
}
