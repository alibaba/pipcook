import { gray, resize, tokenize } from './model';

describe('plugin api for models', () => {
  it('should return tokenized array for the text', () => {
    const text = 'hello, this is test';
    const tokenized = tokenize(text);
    expect(tokenized.__len__()).toEqual(5);
  });
});
