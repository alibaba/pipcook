from .backend_utils import get_filter_dim
from imageio import imread
from skimage.transform import resize as imresize
import numpy as np
import os

class ImageGenerator(object):
    def __init__(self, root, resize=None, crop=None, flip=None):
        self.img_list = os.listdir(root)
        self.root = root
        self.resize = resize
        self.crop = crop
        self.flip = flip

        print('ImageGenerator from {} [{}]'.format(root, len(self.img_list)))

    def __call__(self, bs):
        while True:
            try:
                imgs = []
                for _ in range(bs):
                    img = imread(os.path.join(self.root, np.random.choice(self.img_list)))

                    if self.resize: img = imresize(img, self.resize)
                    if self.crop:
                        left = np.random.randint(0, img.shape[0]-self.crop[0])
                        top  = np.random.randint(0, img.shape[1]-self.crop[1])
                        img = img[left:left+self.crop[0], top:top+self.crop[1]] 
                    if self.flip:
                        if np.random.random() > 0.5:
                            img = img[:, ::-1, :]

                    imgs.append(img)

                imgs = np.array(imgs)
                if get_filter_dim() == 1:
                    imgs = imgs.transpose(0, 3, 1, 2)

                imgs = imgs/127.5-1

                return imgs
            except:
                pass
