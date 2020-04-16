import { shuffle, sample } from './datasets';

describe('plugin api for datasets', () => {
  it('should return the array with same length when shuffle', () => {
    const array = [ 1, 2, 3, 4 ];
    shuffle(array);
    expect(array.length).toEqual(4);
  });

  it('should samples part of array', () => {
    const array = [ 1, 2, 3, 4 ];
    const samples = sample(array, 2);
    expect(samples.length).toEqual(2);
  });
});
