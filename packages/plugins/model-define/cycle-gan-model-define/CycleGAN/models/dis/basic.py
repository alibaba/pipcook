import tensorflow as tf
from tensorflow.keras.layers import Conv2D
from tensorflow.keras.layers import Activation, Input, Dropout
from tensorflow.keras.layers import LeakyReLU
from tensorflow.keras.models import Model

from ...layers import ReflectPadding2D, InstanceNormalization2D

padding = ReflectPadding2D
normalize = InstanceNormalization2D

def basic_D(input_shape, ndf, n_layers=3, kw=4, dropout=0.0, use_sigmoid=False, **kwargs):
    padw = (kw-1)/2
    
    input = Input(input_shape)
    x = Conv2D(ndf, (kw,kw), strides=(2,2), padding='same')(input)
    x = LeakyReLU(0.2)(x)

    for i in range(n_layers-1):
        x = Conv2D(ndf*min(2**(i+1), 8), (kw,kw), strides=(2,2), padding='same')(x)
        x = normalize()(x)
        if dropout > 0.: x = Dropout(dropout)(x)
        x = LeakyReLU(0.2)(x)

    x = Conv2D(ndf*min(2**(n_layers+1), 8), (kw,kw), strides=(1,1), padding='same')(x)
    x = normalize()(x)
    x = LeakyReLU(0.2)(x)

    x = Conv2D(1, (kw,kw), strides=(1,1), padding='same')(x)
    if use_sigmoid:
        x = Activation('sigmoid')(x)

    model = Model(input, x, name=kwargs.get('name',None))
    model.summary()

    return model

