# from .backend_utils import get_filter_dim
import cv2
import numpy as np
import os
import sys

class ImageGenerator(object):
    def __init__(self, root, resize=None, crop=None, flip=None):
        filelist = os.listdir(root)
        self.root = root
        self.resize = resize
        self.crop = crop
        self.flip = flip

        self.img_list = [file for file in filelist if file.endswith('.jpg')]
        print('self.img_list', self.img_list)
        sys.stdout.flush()
        print('ImageGenerator from {} [{}]'.format(root, len(self.img_list)))

    def __call__(self, bs):
        print()
        while True:
            try:
                imgs = []
                for _ in range(bs):
                    image_file = np.random.choice(self.img_list)
                    img = cv2.imread(os.path.join(self.root, image_file))
                    if self.resize: img = cv2.resize(img, self.resize)
                    if self.crop:
                        left = np.random.randint(0, img.shape[0]-self.crop[0])
                        top  = np.random.randint(0, img.shape[1]-self.crop[1])
                        img = img[left:left+self.crop[0], top:top+self.crop[1]]
                    if self.flip:
                        if np.random.random() > 0.5:
                            img = img[:, ::-1, :]
                    imgs.append(img)

                imgs = np.array(imgs)
                # tensorflow only
                # if get_filter_dim() == 1:
                #     imgs = imgs.transpose(0, 3, 1, 2)

                imgs = imgs/127.5-1

                return imgs
            except:
                raise
