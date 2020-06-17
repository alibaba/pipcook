import { ModelTrainType, UniModel, CocoDataset, ModelTrainArgsType } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const sys = boa.import('sys');
const { tuple } = boa.builtins();
sys.path.insert(0, path.join(__dirname, '..'));
const { ImageGenerator } = boa.import('CycleGAN.utils.data_utils');

const cycleGANModelTrain: ModelTrainType = async (data: CocoDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel> => {
  // const {
  //   pool_size = 50,
  //   load_model = null
  // } = args;
  console.log('CocoDataset', CocoDataset);
  
  console.log('cwd', process.cwd);
  const IG_A = new ImageGenerator(
    boa.kwargs({
      root: '/Users/feiyu.zfy/Downloads/cycleGan/train/a', 
      resize: true,
      crop: tuple([128, 128])
    })
  );
  const IG_B = new ImageGenerator(
    boa.kwargs({
      root: '/Users/feiyu.zfy/Downloads/cycleGan/train/b', 
      resize: true,
      crop: tuple([128, 128])
    })
  );
  model.model.fit(IG_A, IG_B);
  return model;
};

export default cycleGANModelTrain;
