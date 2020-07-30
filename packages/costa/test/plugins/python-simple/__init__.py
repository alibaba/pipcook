import numpy as np

def main(input):
  print('hello python!', input)
  if 'fn1' in input:
    # TODO(yorkie): support setattr
    input.get('fn1')(np.zeros(2))
    input.get('obj').get('fn2')()

  return np.zeros(10)
