import { ModelDefineType, UniModel, ModelDefineArgsType, Sample, ImageDataset } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const sys = boa.import('sys');
// TODO(Feely): support dot in the module name
sys.path.insert(0, path.join(__dirname, '..'));
const tf = boa.import('tensorflow');
const { CycleGAN } = boa.import('CycleGAN.models');
const cv2 = boa.import('cv2');
const base64 = boa.import('base64');

type PredictType = 'a2b' | 'b2a';
interface CycleGanImageSample extends Sample {
  data: string;
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
  a_to_b_model_file: '',
  b_to_a_model_file: '',
  dis_a_model_file: '',
  dis_b_model_file: ''
};

const cycleGanModelDefine: ModelDefineType = async (data: ImageDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  opt = {
    ...opt,
    ...args
  };
  const model = new CycleGAN(opt);
  const pipcookModel: UniModel = {
    model,
    config: null,
    predict: function (inputData: CycleGanImageSample) {
      let m = inputData.predictType == 'a2b' ? model.AtoB : model.BtoA;
      let image = tf.io.read_file(inputData.data);
      image = tf.image.decode_jpeg(image, boa.kwargs({
        channels: 3
      }));
      const predictResult = m.predict(image);
      const buffer = cv2.imencode('.jpg', predictResult)[1];
      return base64.b64encode(buffer);
    }
  };
  return pipcookModel;
};

export default cycleGanModelDefine;
