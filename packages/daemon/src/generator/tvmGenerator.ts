import { keras2Wasm } from './keras';

const validModel = ['keras'];

const inputModel = process.argv[process.argv.length - 1];
if (validModel.includes(inputModel)) {
  const {dist, projPackage, opts, inputLayers = ''} = JSON.parse(process.argv[process.argv.length - 2]);
  if (inputModel === 'keras') {
   keras2Wasm(dist, projPackage, opts, inputLayers);
  }
} else {
  console.error(`The convert type is ${inputModel} but only ${validModel.join(', ')} are available`);
}
