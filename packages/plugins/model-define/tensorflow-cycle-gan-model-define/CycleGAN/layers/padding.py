from tensorflow.keras.layers import Layer
import tensorflow.keras.backend as K


class ReflectPadding2D(Layer):
    ''' Thanks for github.com/jayanthkoushik/neural-style '''

    def __init__(self, padding=(1, 1), **kwargs):
        self.padding = padding
        super(ReflectPadding2D, self).__init__(**kwargs)

    def build(self, input_shape):
        super(ReflectPadding2D, self).build(input_shape)

    def call(self, x, mask=None):
        if K.backend() == 'theano':
            T = K.theano.tensor
            p0, p1 = self.padding[0], self.padding[1]
            y = T.zeros((x.shape[0], x.shape[1], x.shape[2]+(2*p0),
                         x.shape[3]+(2*p1)), dtype=K.theano.config.floatX)
            y = T.set_subtensor(y[:, :, p0:-p0, p1:-p1], x)
            y = T.set_subtensor(y[:, :, :p0, p1:-p1], x[:, :, p0:0:-1, :])
            y = T.set_subtensor(y[:, :, -p0:, p1:-p1], x[:, :, -2:-2-p0:-1])
            y = T.set_subtensor(y[:, :, p0:-p0, :p1], x[:, :, :, p1:0:-1])
            y = T.set_subtensor(y[:, :, p0:-p0, -p1:], x[:, :, :, -2:-2-p1:-1])
            y = T.set_subtensor(y[:, :, :p0, :p1], x[:, :, p0:0:-1, p1:0:-1])
            y = T.set_subtensor(y[:, :, -p0:, :p1],
                                x[:, :, -2:-2-p0:-1, p1:0:-1])
            y = T.set_subtensor(y[:, :, :p0, -p1:],
                                x[:, :, p0:0:-1, -2:-2-p1:-1])
            y = T.set_subtensor(y[:, :, -p0:, -p1:],
                                x[:, :, -2:-2-p0:-1, -2:-2-p1:-1])
        else:
            raise NotImplemented(
                "Please complete `CycGAN/layers/padding.py` to run on backend {}.".format(K.backend()))
        return y

    def compute_output_shape(self, input_shape):
        return (input_shape[0], input_shape[1], input_shape[2]+(2*self.padding[0]), input_shape[3]+(2*self.padding[1]))
