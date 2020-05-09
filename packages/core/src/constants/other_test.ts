import * as other from './other';

const { OutputType } = other;

describe('other constants', () => {
  it('should own some constants', () => {
    expect(other.STATUS_NOT_EXECUTE).toEqual('not execute');
    expect(other.STATUS_SUCCESS).toEqual('success');
    expect(other.STATUS_FAILURE).toEqual('failure');
    expect(other.STATUS_RUNNING).toEqual('running');

    expect(OutputType.Data).toEqual('data');
    expect(OutputType.Model).toEqual('model');
    expect(OutputType.Evaluate).toEqual('evaluate');
    expect(OutputType.Merge).toEqual('merge');
    expect(OutputType.ModelToSave).toEqual('modeltosave');
    expect(OutputType.OriginData).toEqual('origindata');
  });
});
