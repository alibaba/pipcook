import tensorflow as tf
import tensorflow.keras.backend as K

def get_filter_dim():
    '''
        Tensorflow uses `channels_last`: (batch, height, width, channels) 
    '''
    return 3
