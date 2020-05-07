import * as other from './other';

describe('other constants', () => {
  it('should own some constants', () => {
    expect(other.STATUS_NOT_EXECUTE).toEqual('not execute');
    expect(other.STATUS_SUCCESS).toEqual('success');
    expect(other.STATUS_FAILURE).toEqual('failure');
    expect(other.STATUS_RUNNING).toEqual('running');

    expect(other.DATA).toEqual('data');
    expect(other.MODEL).toEqual('model');
    expect(other.EVALUATE).toEqual('evaluate');
    expect(other.MERGE).toEqual('merge');
    expect(other.MODELTOSAVE).toEqual('modeltosave');
    expect(other.ORIGINDATA).toEqual('origindata');
  });
});
