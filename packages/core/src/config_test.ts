import config from './config';
const debug = require('debug')('core/test');

describe('config', () => {
  it('should own the version property', () => {
    debug(process.env);
    expect(typeof config.version).toEqual('string');
  });
});
