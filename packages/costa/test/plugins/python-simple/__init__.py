import numpy as np

def main(input):
  print('hello python!', input)
  if hasattr(input, 'fn1'):
    input.fn1(np.zeros(2))
    input.obj.fn2()

  return np.zeros(10)
