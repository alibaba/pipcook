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

from ...layers import ReflectPadding2D, InstanceNormalization2D
import sys
padding = ZeroPadding2D

def normalize():
    return InstanceNormalization2D()

def scaleup(input, ngf, kss, strides, padding):
    x = UpSampling2D(strides)(input)
    x = Conv2D(ngf, kss, padding=padding)(x)
    return x


def res_block(input, filters, kernel_size=(3,3), strides=(1,1)):
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

    merged = Add()([input, x])
    return merged

def resnet_6blocks(input_shape, output_nc, ngf, **kwargs):
    ks = 3
    f = 7
    p = (f-1)/2

    input = Input(input_shape)

    x = padding((int(p),int(p)))(input)
    x = Conv2D(ngf, (f,f),)(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    x = Conv2D(ngf*2, (ks,ks), strides=(2,2), padding='same')(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    x = Conv2D(ngf*4, (ks,ks), strides=(2,2), padding='same')(x)
    x = normalize()(x)
    x = Activation('relu')(x)

    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)
    x = res_block(x, ngf*4)

    x = scaleup(x, ngf*2, (ks, ks), strides=(2,2), padding='same')
    x = normalize()(x)
    x = Activation('relu')(x)
    
    x = scaleup(x, ngf, (ks, ks), strides=(2,2), padding='same')
    x = normalize()(x)
    x = Activation('relu')(x)

    x = padding((int(p),int(p)))(x)
    x = Conv2D(output_nc, (f,f))(x)
    x = Activation('tanh')(x)
    
    model = Model(input, x, name=kwargs.get('name',None))
    print('Model resnet 6blocks:')
    model.summary()
    return model
