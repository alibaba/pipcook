import time

class Foobar(object):
  """docstring for Foobar"""
  def __init__(self):
    super(Foobar, self).__init__()
    self.test = "pythonworld"
    self.__exitcode__ = 0

  def hellomsg(self, x):
    raise Exception("Not Impl")

  def ping(self, x):
    return self.hellomsg(x)

  def sleep(self):
    time.sleep(1)

  def callfunc(self, fn):
    return fn(233)

  def testObjPass(self, obj):
    v = obj.fn1(obj.input)
    return obj.scope.fn2(v)

  def testGen(self, count):
    while count >= 0:
      yield count
      count -= 1

  def __enter__(self):
    self.entered = True

  def __exit__(self, exc_type, exc, traceback):
    self.exited = True
    self.exc = exc
    if (self.__exitcode__ == 1):
      return False
    return True

__all__ = ['Foobar']
