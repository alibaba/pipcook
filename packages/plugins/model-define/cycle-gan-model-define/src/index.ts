import { ModelDefineType, UniModel, ModelDefineArgsType, ImageSample, ImageDataset } from '@pipcook/pipcook-core';
import * as path from 'path';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const tf = boa.import('tensorflow');
const { CycleGAN } = boa.import('CycleGAN.models');
const np = boa.import('numpy');
const cv2 = boa.import('cv2');
const base64 = boa.import('base64');

type PredictType = 'a2b' | 'b2a';

let opt = {
  // data
  // path to images (should have subfolders 'train', 'val', etc)
  DATA_ROOT: '',
  shapeA: tuple([ 128, 128, 3 ]),
  shapeB: tuple([ 128, 128, 3 ]),
  // scale images to this size
  resize: tuple([ 143, 143 ]),
  // then crop to this size
  crop  : tuple([ 128, 128 ]),

  // net definition
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

  // optimizers
  // initial learning rate for adam
  // momentum term of adam
  lr: 0.0002,
  beta1: 0.5,

  // training parameters
  // images in batch
  batch_size: 5,
  // of iter at starting learning rate
  niter: 100000,
  // the size of image buffer that stores previously generated images
  pool_size: 50,
  save_iter: 50,
  d_iter: 10,

  // dirs
  pic_dir: 'quickshots',
  // of iter to linearly decay learning rate to zero
  niter_decay: 100,
  //  of examples per epoch. math.huge for full dataset
  ntrain: np.inf,
  // if flip the images for data argumentation
  flip: 1,
  // display window id.
  display_id: 10,
  // display window size
  display_winsize: 128,
  // display the current results every display_freq iterations
  display_freq: 25,
  // gpu = 0 is CPU mode. gpu=X is GPU mode on GPU X
  gpu: 0,
  // name of the experiment, should generally be passed on the command line
  name: '',
  // AtoB or BtoA
  which_direction: 'AtoB',
  // train, val, test, etc
  phase: 'train',
  // threads for loading data
  nThreads: 2,
  // save a model every save_epoch_freq epochs (does not overwrite previously saved models)
  save_epoch_freq: 1,
  // save the latest model every latest_freq sgd iterations (overwrites the previous latest model)
  save_latest_freq: 5000,
  // print the debug information every print_freq iterations
  print_freq: 50,
  // save the current display of results every save_display_freq_iterations
  save_display_freq: 2500,
  // if continue training, load the latest model: 1: true, 0: false
  continue_train: 0,
  // if 1, takes images in order to make batches, otherwise takes them randomly
  serial_batches: 0,
  // models are saved here
  checkpoints_dir: './checkpoints',
  // set to 0 to not use cudnn
  cudnn: 1,
  // batch or instance normalization
  norm: 'instance',
  // only used if which_model_netD=='n_layers'
  n_layers_D: 3,
  // content loss type: pixel, vgg
  content_loss: 'pixel',
  // layer used in content loss (e.g. relu4_2)
  layer_name: 'pixel',
  // which mode to run. 'cycle_gan', 'pix2pix', 'bigan', 'content_gan'
  model: 'cycle_gan',
  // if > 0, use the dataloader for where the images are aligned
  align_data: 0,
  // resizing/cropping strategy
  resize_or_crop: 'resize_and_crop',
  // use identity mapping. Setting opt.identity other than 1 has an effect of scaling
  // the weight of the identity mapping loss. For example, if the weight of the identity
  // loss should be 10 times smaller than the weight of the reconstruction loss,
  // please set opt.identity = 0.1
  identity: 0,
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
    predict: function (inputData: ImageSample, predictType: PredictType) {
      let m = predictType == 'a2b' ? model.AtoB : model.BtoA;
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
