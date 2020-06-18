import numpy as np
import imageio
import sys

def vis_grid(X, size, save_path=None):
    if X.shape[1] in [1,3,4]:
        X = X.transpose(0, 2, 3, 1)
    h, w = X.shape[1:3]
    img = np.zeros((h*size[0], w*size[1], 3))
    for n, x in enumerate(X):
        j = n/size[1]
        i = n%size[1]
        if n >= size[0]* size[1]: break
        img[int(j*h):int(j*h+h), int(i*w):int(i*w+w), :] = x
    if save_path is not None:
        imageio.imwrite(save_path, img)
    return img
