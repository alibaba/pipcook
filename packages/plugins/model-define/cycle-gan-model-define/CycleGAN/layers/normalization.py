from tensorflow.keras.layers import Layer
import tensorflow.keras.backend as K

class InstanceNormalization2D(Layer):
    ''' Thanks for github.com/jayanthkoushik/neural-style '''
    def __init__(self, **kwargs):
        super(InstanceNormalization2D, self).__init__(**kwargs)

    def build(self, input_shape):
        self.scale = self.add_weight(name='scale', shape=(input_shape[1],), initializer="one", trainable=True)
        self.shift = self.add_weight(name='shift', shape=(input_shape[1],), initializer="zero", trainable=True)
        super(InstanceNormalization2D, self).build(input_shape)

    def call(self, x, mask=None):
        def image_expand(tensor):
            return K.expand_dims(K.expand_dims(tensor, -1), -1)

        def batch_image_expand(tensor):
            return image_expand(K.expand_dims(tensor, 0))

        hw = K.cast(x.shape[2] * x.shape[3], K.floatx())
        mu = K.sum(x, [-1, -2]) / hw
        mu_vec = image_expand(mu) 
        sig2 = K.sum(K.square(x - mu_vec), [-1, -2]) / hw
        y = (x - mu_vec) / (K.sqrt(image_expand(sig2)) + K.epsilon())

        scale = batch_image_expand(self.scale)
        shift = batch_image_expand(self.shift)
        return scale*y + shift 
#       else:
#           raise NotImplemented("Please complete `CycGAN/layers/padding.py` to run on backend {}.".format(K.backend()))

    def compute_output_shape(self, input_shape):
        return input_shape 
