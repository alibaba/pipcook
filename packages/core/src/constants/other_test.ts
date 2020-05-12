import { OutputType } from './other';

describe('other constants', () => {
  it('should own some constants', () => {
    expect(OutputType.Data).toEqual('data');
    expect(OutputType.Model).toEqual('model');
    expect(OutputType.Evaluate).toEqual('evaluate');
    expect(OutputType.Merge).toEqual('merge');
    expect(OutputType.ModelToSave).toEqual('modeltosave');
    expect(OutputType.OriginData).toEqual('origindata');
  });
});
