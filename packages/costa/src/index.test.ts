import test from 'ava';
import { NpmPackageNameSchema } from './index';

test('should create NpmPackageNameSchema.', (t) => {
  const schema = new NpmPackageNameSchema();
  schema.name = 'packageName';
  t.is(schema.packageName, 'packageName');
  schema.scope = '@scope';
  t.is(schema.packageName, '@scope/packageName');
});
