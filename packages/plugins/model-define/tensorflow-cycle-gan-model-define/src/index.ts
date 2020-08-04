import { ModelDefineType, UniModel, ModelDefineArgsType, Sample, ImageDataset } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const { tuple, dict } = boa.builtins();
const sys = boa.import('sys');
// TODO(Feely): support dot in the module name
sys.path.insert(0, path.join(__dirname, '..'));
const { CycleGAN } = boa.import('CycleGAN.models');

type PredictType = 'a2b' | 'b2a';

interface CycleGanImageSampleData {
  path: string;
  predictType: PredictType;
}

interface CycleGanImageSample extends Sample {
  data: CycleGanImageSampleData;
  predictType: PredictType;
  label: any;
}

let opt = {
  shapeA: tuple([ 128, 128, 3 ]),
  shapeB: tuple([ 128, 128, 3 ]),
  // scale images to this size
  resize: tuple([ 143, 143 ]),
  // then crop to this size
  crop: tuple([ 128, 128 ]),

  /**
   * net definition
   */
  // selects model to use for netD
  which_model_netD: 'basic',
  // selects model to use for netG
  which_model_netG: 'resnet_6blocks',
  // if 1, use least square GAN, if 0, use vanilla GAN
  use_lsgan: 1,
  //  of gen filters in first conv layer
  ngf: 64,
  // of discrim filters in first conv layer
  ndf: 64,
  lmbd: 10.0,
  idloss: 1.0,

  /**
   * optimizers
   */
  // initial learning rate for adam
  lr: 0.0002,
  // momentum term of adam
  beta1: 0.5,

  // model file
  recoverPath: ''
};

const cycleGanModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  opt = dict({
    ...opt,
    ...args
  });
  const model = new CycleGAN(opt);
  const pipcookModel: UniModel = {
    model,
    config: null,
    predict: function (inputData: CycleGanImageSample) {
      return model.predict(inputData.data.path, inputData.data.predictType);
    }
  };
  return pipcookModel;
};

export default cycleGanModelDefine;
