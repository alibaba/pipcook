from .resnet import resnet_6blocks
import sys

def defineG(which_model_netG, input_shape, output_shape, ngf, **kwargs):
    output_nc = output_shape[2]
    if which_model_netG == 'resnet_6blocks':
        return resnet_6blocks(input_shape, output_nc, ngf, **kwargs)
    else:
        raise NotImplemented

