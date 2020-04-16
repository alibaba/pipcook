import config from './config';

describe('config', () => {
  it('should own the version property', () => {
    console.log(process.env);
    expect(typeof config.version).toEqual('string');
  });
});
