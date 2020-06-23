# keras version of https://github.ckom/junyanz/CycleGAN/models/cycle_gan_model.lua

import os
import base64
from .base import BaseModel
from .gen import defineG
from .dis import defineD
import tensorflow as tf
from tensorflow.keras.layers import Input
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.models import Model
from tensorflow.keras.models import load_model
import numpy as np
import sys
import cv2
from ..utils.vis_utils import vis_grid
from ..image_loader import ImageGenerator
from ..layers import InstanceNormalization2D

class CycleGAN(BaseModel):
    name = 'CycleGAN'
    @staticmethod
    def init_network(model):
        for w in model.weights:
            if w.name.startswith('conv2d') and w.name.endswith('kernel'):
                value = np.random.normal(loc=0.0, scale=0.02, size=w.get_value().shape)
                w.set_value(value.astype('float32'))
            if w.name.startswith('conv2d') and w.name.endswith('bias'):
                value = np.zeros(w.get_value().shape)
                w.set_value(value.astype('float32'))

    def __init__(self, opt):
        customObj = { 'InstanceNormalization2D': InstanceNormalization2D }
        if opt['recoverPath']:
            gen_B = load_model(os.path.join(opt['recoverPath'], 'a2b.h5'), custom_objects=customObj)
            dis_B = load_model(os.path.join(opt['recoverPath'], 'disb.h5'), custom_objects=customObj)
            gen_A = load_model(os.path.join(opt['recoverPath'], 'b2a.h5'), custom_objects=customObj)
            dis_A = load_model(os.path.join(opt['recoverPath'], 'disa.h5'), custom_objects=customObj)
        else:
            gen_B = defineG(opt['which_model_netG'], input_shape=opt['shapeA'], output_shape=opt['shapeB'], ngf=opt['ngf'], name='gen_B')
            self.init_network(gen_B)
            dis_B = defineD(opt['which_model_netD'], input_shape=opt['shapeB'], ndf=opt['ndf'], use_sigmoid=not opt['use_lsgan'], name='dis_B')
            self.init_network(dis_B)
            gen_A = defineG(opt['which_model_netG'], input_shape=opt['shapeB'], output_shape=opt['shapeA'], ngf=opt['ngf'], name='gen_A')
            self.init_network(gen_A)
            dis_A = defineD(opt['which_model_netD'], input_shape=opt['shapeA'], ndf=opt['ndf'], use_sigmoid=not opt['use_lsgan'], name='dis_A')
            self.init_network(dis_A)

        # build for generators
        real_A = Input(opt['shapeA'])
        fake_B = gen_B(real_A)
        dis_fake_B = dis_B(fake_B)
        rec_A = gen_A(fake_B)

        real_B = Input(opt['shapeB'])
        fake_A = gen_A(real_B)
        dis_fake_A = dis_A(fake_A)
        rec_B = gen_B(fake_A)

        if opt['idloss'] > 0:
            G_trainner = Model([real_A, real_B], 
                     [dis_fake_B,   dis_fake_A,     rec_A,      rec_B,      fake_B,     fake_A])
            
            G_trainner.compile(Adam(lr=opt['lr'], beta_1=opt['beta1'],),
                loss=['MSE',        'MSE',          'MAE',      'MAE',      'MAE',      'MAE'],
                loss_weights=[1,    1,              opt['lmbd'],   opt['lmbd'],   opt['idloss']  ,opt['idloss']])
        else:
            G_trainner = Model([real_A, real_B], 
                     [dis_fake_B,   dis_fake_A,     rec_A,      rec_B,      ])
            
            G_trainner.compile(Adam(lr=opt['lr'], beta_1=opt['beta1'],),
                loss=['MSE',        'MSE',          'MAE',      'MAE',      ],
                loss_weights=[1,    1,              opt['lmbd'],   opt['lmbd'],   ])
        # label:  0             0               real_A      real_B


        # build for discriminators 
        real_A = Input(opt['shapeA'])
        fake_A = Input(opt['shapeA'])
        real_B = Input(opt['shapeB'])
        fake_B = Input(opt['shapeB'])

        dis_real_A = dis_A(real_A)
        dis_fake_A = dis_A(fake_A)
        dis_real_B = dis_B(real_B)
        dis_fake_B = dis_B(fake_B)

        D_trainner = Model([real_A, fake_A, real_B, fake_B], 
                [dis_real_A, dis_fake_A, dis_real_B, dis_fake_B])
        D_trainner.compile(Adam(lr=opt['lr'], beta_1=opt['beta1'],), loss='MSE')
        # label: 0           0.9         0           0.9


        self.G_trainner = G_trainner
        self.D_trainner = D_trainner
        self.AtoB = gen_B
        self.BtoA = gen_A
        self.DisA = dis_A
        self.DisB = dis_B
        self.modelOpt = opt

    def fit(self, img_a_list, img_b_list, opt):
        self.trainOpt = opt
        img_A_generator = ImageGenerator(fileList=img_a_list, resize=self.modelOpt['resize'], crop=self.modelOpt['crop'])
        img_B_generator = ImageGenerator(fileList=img_b_list, resize=self.modelOpt['resize'], crop=self.modelOpt['crop'])
        if not os.path.exists(opt['pic_dir']):
            os.mkdir(opt['pic_dir'])
        bs = opt['batch_size']

        fake_A_pool = []
        fake_B_pool = []

        iteration = 0
        while iteration < opt['niter']:
            if opt["verbose"]:
                print('iteration: {}'.format(iteration))
            # sample
            real_A = img_A_generator(bs)
            real_B = img_B_generator(bs)
            # fake pool
            fake_A_pool.extend(self.BtoA.predict(real_B))
            fake_B_pool.extend(self.AtoB.predict(real_A))
            
            fake_A_pool = fake_A_pool[-opt['pool_size']:]
            fake_B_pool = fake_B_pool[-opt['pool_size']:]

            fake_A = [fake_A_pool[ind] for ind in np.random.choice(len(fake_A_pool), size=(bs,), replace=False)]
            fake_B = [fake_B_pool[ind] for ind in np.random.choice(len(fake_B_pool), size=(bs,), replace=False)]
            fake_A = np.array(fake_A)
            fake_B = np.array(fake_B)

            ones  = np.ones((bs,)+self.G_trainner.output_shape[0][1:])
            zeros = np.zeros((bs, )+self.G_trainner.output_shape[0][1:])


            # train
            for _ in range(opt['d_iter']):
                _, D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B = \
                    self.D_trainner.train_on_batch([real_A, fake_A, real_B, fake_B],
                        [zeros, ones*0.9, zeros, ones*0.9])

            if self.modelOpt['idloss'] > 0:
                _, G_loss_fake_B, G_loss_fake_A, G_loss_rec_A, G_loss_rec_B, G_loss_id_A, G_loss_id_B = \
                    self.G_trainner.train_on_batch([real_A, real_B],
                        [zeros, zeros, real_A, real_B, real_A, real_B])
            else:
                _, G_loss_fake_B, G_loss_fake_A, G_loss_rec_A, G_loss_rec_B = \
                    self.G_trainner.train_on_batch([real_A, real_B],
                        [zeros, zeros, real_A, real_B, ])

            if opt["verbose"]:
                print('Generator Loss:')
                print('fake_B: {} rec_A: {} | fake_A: {} rec_B: {}'.\
                        format(G_loss_fake_B, G_loss_rec_A, G_loss_fake_A, G_loss_rec_B))
                if self.modelOpt['idloss'] > 0:
                    print('id_loss_A: {}, id_loss_B: {}'.format(G_loss_id_A, G_loss_id_B))

                print('Discriminator Loss:')
                print('real_A: {} fake_A: {} | real_B: {} fake_B: {}'.\
                        format(D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B))

            resA = self.DisA.predict(real_A)
            resB = self.DisA.predict(fake_A)
            if opt["verbose"]:
                print("Dis_A")
                print("real_A: {}".format(resA.mean()))
                print("fake_A: {}".format(resB.mean()))
            if iteration % opt['save_iter'] == 0:
                imga = real_A
                imga2b = self.AtoB.predict(imga)
                imga2b2a = self.BtoA.predict(imga2b)

                imgb = real_B
                imgb2a = self.BtoA.predict(imgb)
                imgb2a2b = self.AtoB.predict(imgb2a)

                vis_grid(np.concatenate([imga, imga2b, imga2b2a, imgb, imgb2a, imgb2a2b], axis=0),
                        (6, bs), os.path.join(opt['pic_dir'], '{}.jpg'.format(iteration)) )

                self.AtoB.save(os.path.join(opt['pic_dir'], 'a2b.h5'))
                self.BtoA.save(os.path.join(opt['pic_dir'], 'b2a.h5'))
                self.DisA.save(os.path.join(opt['pic_dir'], 'disa.h5'))
                self.DisB.save(os.path.join(opt['pic_dir'], 'disb.h5'))

            iteration += 1
            sys.stdout.flush()

    def evaluate(self, img_a_list, img_b_list):
        img_A_generator = ImageGenerator(fileList=img_a_list, resize=self.modelOpt['resize'], crop=self.modelOpt['crop'])
        img_B_generator = ImageGenerator(fileList=img_b_list, resize=self.modelOpt['resize'], crop=self.modelOpt['crop'])
        bs = self.trainOpt['batch_size']

        fake_A_pool = []
        fake_B_pool = []

        # sample
        real_A = img_A_generator(bs)
        real_B = img_B_generator(bs)

        # fake pool
        fake_A_pool.extend(self.BtoA.predict(real_B))
        fake_B_pool.extend(self.AtoB.predict(real_A))

        fake_A_pool = fake_A_pool[-self.trainOpt['pool_size']:]
        fake_B_pool = fake_B_pool[-self.trainOpt['pool_size']:]

        fake_A = [fake_A_pool[ind] for ind in np.random.choice(len(fake_A_pool), size=(bs,), replace=False)]
        fake_B = [fake_B_pool[ind] for ind in np.random.choice(len(fake_B_pool), size=(bs,), replace=False)]
        fake_A = np.array(fake_A)
        fake_B = np.array(fake_B)

        ones  = np.ones((bs,)+self.G_trainner.output_shape[0][1:])
        zeros = np.zeros((bs, )+self.G_trainner.output_shape[0][1:])

        # train
        _, D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B = \
            self.D_trainner.evaluate([real_A, fake_A, real_B, fake_B],
                [zeros, ones*0.9, zeros, ones*0.9])

        if self.modelOpt['idloss'] > 0:
            _, G_loss_fake_B, G_loss_fake_A, G_loss_rec_A, G_loss_rec_B, G_loss_id_A, G_loss_id_B = \
                self.G_trainner.evaluate([real_A, real_B],
                    [zeros, zeros, real_A, real_B, real_A, real_B])
        else:
            _, G_loss_fake_B, G_loss_fake_A, G_loss_rec_A, G_loss_rec_B = \
                self.G_trainner.evaluate([real_A, real_B],
                    [zeros, zeros, real_A, real_B, ])
        return G_loss_fake_B, G_loss_rec_A, G_loss_fake_A, G_loss_rec_B, \
            G_loss_id_A, G_loss_id_B, D_loss_real_A, D_loss_fake_A, D_loss_real_B, D_loss_fake_B

    def predict(self, imgPath, predictType):
        imgs = np.array([cv2.resize(cv2.imread(imgPath), self.modelOpt['crop'])])/127.5-1
        m = self.AtoB if predictType == 'a2b' else self.BtoA
        result = m.predict(imgs)
        image = (result[0]+1)*127.5
        buff = cv2.imencode('.jpg', image)[1]
        return str(base64.b64encode(buff),'utf8')
