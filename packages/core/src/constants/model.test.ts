import test from 'ava';
import { IMAGE_CLASSIFICATION, OBJECT_DETECTION, TEXT_CLASSIFICATION } from './model';

test('should own some constants', (t) => {
  t.is(IMAGE_CLASSIFICATION, 'image classification');
  t.is(OBJECT_DETECTION, 'object detection');
  t.is(TEXT_CLASSIFICATION, 'text classification');
});
