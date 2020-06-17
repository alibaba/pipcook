#############################################################
# We use zeropadding to replace all SpatialReflectionPadding
#   by claiming `padding='same'`
#
# TODO: should use http://pytorch.org/docs/_modules/torch/nn/modules/instancenorm.html
#   rather than BatchNorm
from tensorflow.keras.layers import Conv2D, Conv2DTranspose, UpSampling2D
from tensorflow.keras.layers import BatchNormalization, Activation, Input, ZeroPadding2D
from tensorflow.keras.layers import Add, Concatenate
from tensorflow.keras.models import Model

from ...utils.backend_utils import get_filter_dim
from ...layers import ReflectPadding2D, InstanceNormalization2D
import sys
padding = ZeroPadding2D # ReflectPadding2D

def normalize():
#   return BatchNormalization(axis=get_filter_dim())
    return InstanceNormalization2D()

def scaleup(input, ngf, kss, strides, padding):
#   x = Conv2DTranspose(ngf, kss, strides=strides, padding=padding)(input)

    # upsample + conv
    x = UpSampling2D(strides)(input)
    x = Conv2D(ngf, kss, padding=padding)(x)
    return x


def res_block(input, filters, kernel_size=(3,3), strides=(1,1)):
    # conv_block:add(nn.SpatialReflectionPadding(1, 1, 1, 1))
    # conv_block:add(nn.SpatialConvolution(dim, dim, 3, 3, 1, 1, p, p))
    # conv_block:add(normalization(dim))
    # conv_block:add(nn.ReLU(true))
    x = padding()(input)
    x = Conv2D(filters=filters, 
                kernel_size=kernel_size,
                strides=strides,)(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    x = padding()(x)
    x = Conv2D(filters=filters, 
                kernel_size=kernel_size,
                strides=strides,)(x)
    x = normalize()(x)

#   merged = Concatenate(axis=get_filter_dim())([input, x])
    merged = Add()([input, x])
    return merged

def resnet_6blocks(input_shape, output_nc, ngf, **kwargs):
    ks = 3
    f = 7
    p = (f-1)/2

    input = Input(input_shape)
    # local e1 = data - nn.SpatialReflectionPadding(p, p, p, p) - nn.SpatialConvolution(3, ngf, f, f, 1, 1) - normalization(ngf) - nn.ReLU(true)
    x = padding((int(p),int(p)))(input)
    x = Conv2D(ngf, (f,f),)(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    # local e2 = e1 - nn.SpatialConvolution(ngf, ngf*2, ks, ks, 2, 2, 1, 1) - normalization(ngf*2) - nn.ReLU(true)
    x = Conv2D(ngf*2, (ks,ks), strides=(2,2), padding='same')(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    # local e3 = e2 - nn.SpatialConvolution(ngf*2, ngf*4, ks, ks, 2, 2, 1, 1) - normalization(ngf*4) - nn.ReLU(true)
    x = Conv2D(ngf*4, (ks,ks), strides=(2,2), padding='same')(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    # local d1 = e3 - build_res_block(ngf*4, padding_type) - build_res_block(ngf*4, padding_type) - build_res_block(ngf*4, padding_type) 
    #  - build_res_block(ngf*4, padding_type) - build_res_block(ngf*4, padding_type) - build_res_block(ngf*4, padding_type)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)

    # local d2 = d1 - nn.SpatialFullConvolution(ngf*4, ngf*2, ks, ks, 2, 2, 1, 1,1,1) - normalization(ngf*2) - nn.ReLU(true)
    # x = Conv2DTranspose(ngf*2, (ks,ks), strides=(2,2), padding='same')(x)
    x = scaleup(x, ngf*2, (ks, ks), strides=(2,2), padding='same')
    x = normalize()(x)
    x = Activation('relu')(x)
    
    # local d3 = d2 - nn.SpatialFullConvolution(ngf*2, ngf, ks, ks, 2, 2, 1, 1,1,1) - normalization(ngf) - nn.ReLU(true)
    # x = Conv2DTranspose(ngf, (ks,ks), strides=(2,2), padding='same')(x)
    x = scaleup(x, ngf, (ks, ks), strides=(2,2), padding='same')
    x = normalize()(x)
    x = Activation('relu')(x)

    # local d4 = d3 - nn.SpatialReflectionPadding(p, p, p, p) - nn.SpatialConvolution(ngf, output_nc, f, f, 1, 1) - nn.Tanh()
    x = padding((int(p),int(p)))(x)
    x = Conv2D(output_nc, (f,f))(x)
    x = Activation('tanh')(x)
    
    model = Model(input, x, name=kwargs.get('name',None))
    print('Model resnet 6blocks:')
    model.summary()
    return model



