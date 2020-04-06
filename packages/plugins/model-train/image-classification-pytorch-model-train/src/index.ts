import {ModelTrainType, ImageDataset, ModelTrainArgsType, PytorchModel, ImageDataLoader} from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
sys.path.insert(0,'/Users/queyue/Documents/work/pipcook/pipcook/pipcook_venv/lib/python3.7/site-packages');

const {enumerate, list, len, dict} = boa.builtins();
const torch = boa.import('torch');
const {DataLoader, Dataset} = boa.import('torch.utils.data');
const Image = boa.import('PIL.Image');
const np = boa.import('numpy');
const transforms = boa.import('torchvision.transforms');

interface dataMap {
  fileName: string;
  className: number;
}

/**
 * @ignore
 * create custom dataset
 */
const getDataSet = async (dataLoader: ImageDataLoader) => {
  const data: dataMap[] = [];

  const count = await dataLoader.len();

  for (let i = 0; i < count; i++) {
    const currentData = await dataLoader.getItem(i);
    if (fs.existsSync(currentData.data)) {
      data.push({
        fileName: currentData.data,
        className: currentData.label.categoryId
      });
    }
  }

  const transform = transforms.Compose(
    [transforms.ToTensor()]
  );

  class ImageClassificationData extends Dataset {
    data: any;
    transform: any;

    constructor(transform: any) {
      super();
      this.data = list(data);
      this.transform = transform;
    }

    __len__() {
      return len(this.data);
    }

    __getitem__(index: any) {
      if (torch.is_tensor(index)) {
        index = index.tolist()
      }

      const imageData = this.data[index];
      let image = np.array(Image.open(imageData['fileName']));
      if (this.transform) {
        image = this.transform(image);
      }
      const label = imageData['className'];

      return dict({
        image,
        label
      });
    }
  }

  return new ImageClassificationData(transform);
}

const modelTrain: ModelTrainType = 
  async (data: ImageDataset, model: PytorchModel, args: ModelTrainArgsType): Promise<PytorchModel> => {
  const {
    epochs = 10,
    batchSize = 16,
    saveModel,
    printEvery = 100
  } = args;

  const { trainLoader, validationLoader } = data;

  let valDataLoader: any;
  if (validationLoader) {
    const val_dataset = await getDataSet(validationLoader);
    valDataLoader = DataLoader(val_dataset,  boa.kwargs({
      batch_size: batchSize
    }));
  }

  if (trainLoader) {
    const train_dataset = await getDataSet(trainLoader);
    const dataloader = DataLoader(train_dataset,  boa.kwargs({
      batch_size: batchSize
    }));
    for (let i = 0; i < epochs; i++) {
      model.model.train();
      let running_loss = 0;
      enumerate(dataloader, 0).forEach((data: any, steps: number) => {
        let inputs = data['image'];
        let labels = data['label'];

        model.optimizer.zero_grad()

        const outputs = model.model(inputs)
        const loss = model.criterion(outputs, labels)
        loss.backward()
        model.optimizer.step()

        running_loss += loss.item()

        if (steps % printEvery === 0) {
          console.log(`[epoch ${i}, step ${steps}] training loss: ${running_loss / printEvery}`);
          running_loss = 0;
        }
      });

      if (valDataLoader) {
        let test_loss = 0;
        let accuracy = 0;
        
        model.model.eval();
        enumerate(valDataLoader, 0).forEach((data: any, steps: number) => {
          let inputs = data['image'];
          let labels = data['label'];
          const logps = model.model(inputs);
          const batch_loss = model.criterion(logps, labels);
          test_loss += batch_loss.item();
          const ps = torch.exp(logps);
          const [top_p, top_class] = ps.topk(1, boa.kwargs({dim: 1}));
          const labelTensor = labels.view(...top_class.shape);
          const equals = torch.eq(labelTensor, top_class);
          accuracy +=
                torch.mean(equals.type(torch.FloatTensor)).item();
        });
        console.log(`[epoch ${i}] validation loss: ${test_loss / len(valDataLoader)}, accuracy: ${accuracy / len(valDataLoader)}`);
      }
    }
  }

  await saveModel(async (modelPath: string) => {
    await torch.save(model.model.state_dict(), path.join(modelPath, 'final.pth'));
  });

  return model;
}

export default modelTrain;