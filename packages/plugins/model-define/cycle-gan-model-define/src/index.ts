import { ModelDefineType, UniModel, ModelDefineArgsType, ImageSample, CocoDataset } from '@pipcook/pipcook-core';
import * as path from 'path';
import * as fs from 'fs';

const boa = require('@pipcook/boa');
const { tuple } = boa.builtins();
const sys = boa.import('sys');
sys.path.insert(0, path.join(__dirname, '..'));
const tf = boa.import('tensorflow');
const { CycleGAN } = boa.import('CycleGAN.models');
const np = boa.import('numpy');

let opt = {
  // data
  DATA_ROOT: '',         // path to images (should have subfolders 'train', 'val', etc)
  shapeA: tuple([ 128, 128, 3 ]),
  shapeB: tuple([ 128, 128, 3 ]),
  resize: tuple([ 143, 143 ]),         // scale images to this size
  crop  : tuple([ 128, 128 ]),     //  then crop to this size

  // net definition
  which_model_netD: 'basic',        // selects model to use for netD
  which_model_netG: 'resnet_6blocks',   // selects model to use for netG
  use_lsgan: 1,                 // if 1, use least square GAN, if 0, use vanilla GAN
  ngf: 64,               // //  of gen filters in first conv layer
  ndf: 64,               // //  of discrim filters in first conv layer
  lmbd: 10.0,
  idloss: 1.0,

  // optimizers
  lr: 0.0002,            // initial learning rate for adam
  beta1: 0.5,            // momentum term of adam

  // training parameters 
  batch_size: 1,          // // images in batch
  niter: 100,            // //  of iter at starting learning rate
  pool_size: 50,                // the size of image buffer that stores previously generated images
  save_iter: 50,
  d_iter: 10,

  // dirs
  pic_dir: 'quickshots',

  niter_decay: 100,      //  // of iter to linearly decay learning rate to zero
  ntrain: np.inf,        // //  of examples per epoch. math.huge for full dataset
  flip: 1,               // if flip the images for data argumentation
  display_id: 10,        // display window id.
  display_winsize: 128,  // display window size
  display_freq: 25,      // display the current results every display_freq iterations
  gpu: 0,                // gpu = 0 is CPU mode. gpu=X is GPU mode on GPU X
  name: '',              // name of the experiment, should generally be passed on the command line
  which_direction: 'AtoB',    // AtoB or BtoA
  phase: 'train',             // train, val, test, etc
  nThreads: 2,                // // threads for loading data
  save_epoch_freq: 1,         // save a model every save_epoch_freq epochs (does not overwrite previously saved models)
  save_latest_freq: 5000,     // save the latest model every latest_freq sgd iterations (overwrites the previous latest model)
  print_freq: 50,             // print the debug information every print_freq iterations
  save_display_freq: 2500,    // save the current display of results every save_display_freq_iterations
  continue_train: 0,          // if continue training, load the latest model: 1: true, 0: false
  serial_batches: 0,          // if 1, takes images in order to make batches, otherwise takes them randomly
  checkpoints_dir: './checkpoints', // models are saved here
  cudnn: 1,                         // set to 0 to not use cudnn
  norm: 'instance',             // batch or instance normalization
  n_layers_D: 3,                // only used if which_model_netD=='n_layers'
  content_loss: 'pixel',        // content loss type: pixel, vgg
  layer_name: 'pixel',          // layer used in content loss (e.g. relu4_2)
  model: 'cycle_gan',           // which mode to run. 'cycle_gan', 'pix2pix', 'bigan', 'content_gan'
  align_data: 0,                // if > 0, use the dataloader for where the images are aligned
  resize_or_crop: 'resize_and_crop',  // resizing/cropping strategy
  identity: 0                  // use identity mapping. Setting opt.identity other than 1 has an effect of scaling the weight of the identity mapping loss. For example, if the weight of the identity loss should be 10 times smaller than the weight of the reconstruction loss, please set opt.identity = 0.1
}

const cycleGanModelDefine: ModelDefineType = async (data: CocoDataset, args: ModelDefineArgsType): Promise<UniModel> => {
  opt = {
    ...opt,
    ...args
  }
  const model = new CycleGAN(opt);
  const pipcookModel: UniModel = {
    model,
    config: null,
    predict: function (inputData: ImageSample) {
    }
  };
  return pipcookModel;
};

export default cycleGanModelDefine;
