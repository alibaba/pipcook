import {ModelLoadType, ImageDataset, ModelLoadArgsType, PytorchModel, getMetadata, getModelDir} from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0,'/Users/queyue/Documents/work/pipcook/pipcook/pipcook_venv/lib/python3.7/site-packages');

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: ImageDataset) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 3d');
}

const pytorchCnnModelLoad: ModelLoadType = async (data: ImageDataset, args: ModelLoadArgsType): Promise<PytorchModel> => {
  let {
    modelId,
    modelPath,
    outputShape,
    learningRate=0.001,
    momentum=0.9
  } = args;

  let inputShape: number[];

  // create a new model
  if (!modelId && !modelPath) {
    assertionTest(data);
    inputShape = data.metaData.feature.shape;
    outputShape = Object.keys(data.metaData.labelMap).length
  }

  if (modelId) {
    outputShape = Object.keys(getMetadata(modelId).labelMap);
  }

  if (modelPath) {
    assert.ok(!isNaN(outputShape), 'the output shape should be a number');
  }

  const nn = boa.import('torch.nn');
  const F = boa.import('torch.nn.functional');
  const optim = boa.import('torch.optim');
  const torch = boa.import('torch');
  const {list} = boa.builtins();

  let device = 'cpu';
  if (torch.cuda.is_available()) {
    device = 'cuda:0';
  }

  class Net extends nn.Module {
    conv1: any;
    pool: any;
    conv2: any;
    fc1: any;
    fc2: any;
    fc3: any;
    constructor() {
      super();
      this.conv1 = nn.Conv2d(3, 6, 5);
      this.pool = nn.MaxPool2d(2, 2);
      this.conv2 = nn.Conv2d(6, 16, 5);
      const inputSize = 16 * Math.floor((Math.floor((inputShape[0] - 4) / 2) - 4) / 2) 
      * Math.floor((Math.floor((inputShape[1] - 4) / 2) - 4) / 2);
      this.fc1 = nn.Linear(inputSize, 120);
      this.fc2 = nn.Linear(120, 84);
      this.fc3 = nn.Linear(84, outputShape);
    }
  
  
    forward(x: any) {
      x = this.pool(F.relu(this.conv1(x)))
      x = this.pool(F.relu(this.conv2(x)))
      const size = list(x.size())
      x = x.view(-1, size[1] * size[2] * size[3])
      x = F.relu(this.fc1(x))
      x = F.relu(this.fc2(x))
      x = this.fc3(x)
      return x
    }
  }
  const net = new Net();
  net.to(device);

  if (modelId) {
    net.load_state_dict(torch.load(path.join(getModelDir(modelId), 'model.pth')))
  } else if (modelPath) {
    net.load_state_dict(torch.load(modelPath))
  }
  
  const criterion = nn.CrossEntropyLoss();
  const optimizer = optim.SGD(net.parameters(), boa.kwargs({
    lr: learningRate,
    momentum
  }));

  const pipcookModel: PytorchModel = {
    model: net,
    criterion,
    optimizer,
    predict: function (images: any) {
      const outputs = this.model(images);
      return outputs;
    }
  }
  return pipcookModel;
}

export default pytorchCnnModelLoad;