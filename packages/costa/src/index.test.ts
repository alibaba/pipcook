import { NpmPackageNameSchema } from './index';

describe('test index', () => {
  it('should create NpmPackageNameSchema.', () => {
    const schema = new NpmPackageNameSchema();
    schema.name = 'packageName';
    expect(schema.packageName).toEqual('packageName');
    schema.scope = '@scope';
    expect(schema.packageName).toEqual('@scope/packageName');
  });
});
