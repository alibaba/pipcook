import test from 'ava';
import { PIPCOOK_FRAMEWORK_MIRROR_BASE } from './';

test('PIPCOOK_FRAMEWORK_MIRROR_BASE', (t) => {
  t.is(PIPCOOK_FRAMEWORK_MIRROR_BASE, 'https://pipcook-cloud.oss-cn-hangzhou.aliyuncs.com/framework/');
});
