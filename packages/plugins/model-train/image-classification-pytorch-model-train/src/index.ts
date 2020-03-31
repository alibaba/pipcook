import {ModelTrainType, parseAnnotation, VocDataset, ModelTrainArgsType, PytorchModel} from '@pipcook/pipcook-core';
import * as assert from 'assert';
import * as path from 'path';
import glob from 'glob-promise';
import * as fs from 'fs';

const boa = require('@pipcook/boa');

/** @ignore
 * assertion test
 * @param data 
 */
const assertionTest = (data: VocDataset) => {
  assert.ok(data.metaData.feature, 'Image feature is missing');
  assert.ok(data.metaData.feature.shape.length === 3, 'The size of an image must be 3d');
  assert.ok(data.metaData.label.shape && data.metaData.label.shape.length == 2, 'The label vector should be a one hot vector');
}

interface dataMap {
  fileName: string;
  className: number;
}

/**
 * @ignore
 * create custom dataset
 */
const getDataSet = async (boa: any, dataPath: string, labelMap: {
  [key: string]: number;
}) => {
  const {Dataset} = boa.import('torch.utils.data.Dataset');
  const torch = boa.import('torch');
  const {list, len, dict} = boa.builtins();
  const {Image} = boa.import('PIL');
  const os = boa.import('os');
  const np = boa.import('numpy');

  const dataPaths = await glob(path.join(dataPath, '*.xml'));
  const data: dataMap[] = [];

  for (let i = 0; i < dataPaths.length; i++) {
    const dataJson = await parseAnnotation(dataPaths[i]);
    const filePath = path.join(dataPath, dataJson.annotation.filename[0]);
    if (fs.existsSync(filePath)) {
      data.push({
        fileName: filePath,
        className: labelMap[dataJson.annotation.object[0].name[0]]
      });
    }
  }

  class ImageClassificationData extends Dataset {
    constructor() {
      super();
      this.data = list(data);
    }

    __len__() {
      return len(this.data);
    }

    __getitem__(index: any) {
      if (torch.is_tensor(index)) {
        index = index.tolist()
      }

      const imageData = this.data[index];
      const image = np.array(Image.open(imageData['fileName']));
      const label = imageData['className'];

      return dict({
        image,
        label
      });
    }
  }

  return new ImageClassificationData();
}

const pytorchPascolVocModelTrain: ModelTrainType = 
  async (data: VocDataset, model: PytorchModel, args: ModelTrainArgsType): Promise<PytorchModel> => {
  const {
    epochs = 10,
    batchSize = 16,
    saveModel
  } = args;

  const torch = boa.import('torch');
  const {DataLoader} = boa.import('torch.utils.data');
  const {enumerate} = boa.builtins();

  let device = 'cpu';
  if (torch.cuda.is_available()) {
    device = 'cuda:0';
  }

  if (data.trainData) {
    const train_dataset = await getDataSet(boa, data.trainData, data.metaData.labelMap);
    const dataloader = DataLoader(train_dataset,  boa.kwargs({
      batch_size: batchSize
    }));
    model.model.train();
    for (let i = 0; i < epochs; i++) {
      let running_loss = 0;
      enumerate(dataloader, 0).forEach((data: any, i: number) => {
        let inputs = data['image'];
        let labels = data['label'];

        model.optimizer.zero_grad()

        const outputs = model.model(inputs)
        const loss = model.criterion(outputs, labels)
        loss.backward()
        model.optimizer.step()

        running_loss += loss.item()
        if (i % 2000 == 1999) {
          console.log(i + 1, running_loss / 2000);
          running_loss = 0;
        }
      }) 
    }
  }
}

export default pytorchPascolVocModelTrain;