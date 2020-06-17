from .basic import basic_D

def defineD(which_model_netD, input_shape, ndf, use_sigmoid=False, **kwargs):
    if which_model_netD == 'basic':
        return basic_D(input_shape, ndf, use_sigmoid=use_sigmoid, **kwargs)
    else:
        raise NotImplemented

    
