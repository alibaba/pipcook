import {ModelEvaluateType, PytorchModel, ArgsType, EvaluateResult, ImageDataLoader, ImageDataset} from '@pipcook/pipcook-core';

import * as tf from '@tensorflow/tfjs-node-gpu';
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

/**
 * 
 * @param data Pipcook uniform sample data
 * @param model Pipcook model
 * @param args args: specify batch size, total batches to iterate
 */
const ModelEvalute: ModelEvaluateType = 
  async (data: ImageDataset, model: PytorchModel, args: ArgsType): Promise<EvaluateResult> => {
    const {
      batchSize = 16,
    } = args;

    const { testLoader } = data;

  // sample data must contain test data
  if (testLoader) {
    const test_dataset = await getDataSet(testLoader);
    const testDataLoader = DataLoader(test_dataset,  boa.kwargs({
      batch_size: batchSize
    }));

    let test_loss = 0;
    let accuracy = 0;
    
    model.model.eval();
    enumerate(testDataLoader, 0).forEach((data: any, steps: number) => {
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
    return {
      loss: test_loss / len(testDataLoader),
      accuracy: accuracy / len(testDataLoader)
    }
  } 
  
  return {};
}

export default ModelEvalute;
