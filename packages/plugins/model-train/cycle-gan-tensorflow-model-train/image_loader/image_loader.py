import cv2
import numpy as np
import os
import sys

class ImageGenerator(object):
    def __init__(self, fileList, resize=None, crop=None, flip=None):
        self.resize = resize
        self.crop = crop
        self.flip = flip

        self.img_list = [file for file in fileList if file.endswith('.jpg')]

    def __call__(self, bs):
        print()
        while True:
            try:
                imgs = []
                for _ in range(bs):
                    image_file = np.random.choice(self.img_list)
                    img = cv2.imread(image_file)
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

                imgs = imgs/127.5-1

                return imgs
            except:
                raise
