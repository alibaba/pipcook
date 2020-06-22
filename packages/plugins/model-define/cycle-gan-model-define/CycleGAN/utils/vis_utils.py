import numpy as np
import cv2
import sys


def vis_grid(X, size, save_path=None):
    if X.shape[1] in [1, 3, 4]:
        X = X.transpose(0, 2, 3, 1)
    h, w = X.shape[1:3]
    img = np.zeros((h*size[0], w*size[1], 3))
    for n, x in enumerate(X):
        j = int(n/size[1])
        i = int(n % size[1])
        if n >= size[0] * size[1]:
            break
        img[j*h:j*h+h, i*w:i*w+w, :] = x
    if save_path is not None:
        cv2.imwrite(save_path, (img + 1)*127.5)
    return img
