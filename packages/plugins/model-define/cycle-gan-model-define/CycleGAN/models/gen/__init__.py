from .resnet import resnet_6blocks
from ...utils.backend_utils import get_filter_dim
import sys

def defineG(which_model_netG, input_shape, output_shape, ngf, **kwargs):
    output_nc = output_shape[get_filter_dim()-1]
    print(output_nc, output_shape)
    sys.stdout.flush()
    if which_model_netG == 'resnet_6blocks':
        return resnet_6blocks(input_shape, output_nc, ngf, **kwargs)
    else:
        raise NotImplemented

