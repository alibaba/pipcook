import { keras2wasm } from '../convertor/keras';

const validModel = ['keras'];

const inputModel = process.argv[process.argv.length - 1];
try {
  if (validModel.includes(inputModel)) {
    const { dist, projPackage, opts, inputLayers = '' } = JSON.parse(process.argv[process.argv.length - 2]);
    if (inputModel === 'keras') {
      console.log('start')
      keras2wasm(dist, projPackage, opts, inputLayers);
      console.log('finish')
    }
  } else {
    console.error(`The convert type is ${inputModel} but only ${validModel.join(', ')} are available`);
  }
} catch (err) {
  console.error(`Encounter ${err}`);
}
