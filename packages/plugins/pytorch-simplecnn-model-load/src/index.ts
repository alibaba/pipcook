import {ModelLoadType, UniformSampleData, PascolVocSampleData, ModelLoadArgsType, PytorchModel, getMetadata, getModelDir} from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as path from 'path';

const boa = require('@pipcook/boa');

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: PascolVocSampleData) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 3d');
  assert.ok(data.metaData.label.shape && data.metaData.label.shape.length == 2, 'The label vector should be a one hot vector');
}

const pytorchCnnModelLoad: ModelLoadType = async (data: UniformSampleData, args: ModelLoadArgsType): Promise<PytorchModel> => {
  let {
    modelId,
    modelPath,
    outputShape
  } = args;

  let inputShape: number[];

  // create a new model
  if (!modelId && !modelPath) {
    assertionTest(data);
    inputShape = data.metaData.feature.shape;
    outputShape = data.metaData.label.shape;
  }

  if (modelId) {
    outputShape = getMetadata(modelId).label.shape;
  }

  if (modelPath) {
    assert.ok(outputShape.length === 2, 'the output shape should be one hot vector with [1, x]');
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
    constructor() {
      super();
      this.conv1 = nn.Conv2d(3, 6, 5)
      this.pool = nn.MaxPool2d(2, 2)
      this.conv2 = nn.Conv2d(6, 16, 5)
      this.fc2 = nn.Linear(120, 84)
      this.fc3 = nn.Linear(84, outputShape[1])
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
    lr: 0.001,
    momentum: 0.9
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