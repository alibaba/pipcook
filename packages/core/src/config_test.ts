import config from './config';

describe('config', () => {
  it('should own the version property', () => {
    expect(typeof config.version).toEqual('string');
  });
});
