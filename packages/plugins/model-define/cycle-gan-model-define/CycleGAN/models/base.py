class BaseModel(object):
    name = 'BaseModel'
    def __init__(self):
        raise NotImplemented

    def save(self):
        raise NotImplemented

    def plot(self):
        raise NotImplemented
