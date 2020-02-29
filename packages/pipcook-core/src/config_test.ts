import config from './config';

describe('config', () => {
  it('should has the version property', () => {
    expect(typeof config.version).toEqual('string');
  });
});
