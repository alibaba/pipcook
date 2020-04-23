import config from './config';
const debugLog = require('debug')('core/test');

describe('config', () => {
  it('should own the version property', () => {
    debugLog(process.env);
    expect(typeof config.version).toEqual('string');
  });
});
