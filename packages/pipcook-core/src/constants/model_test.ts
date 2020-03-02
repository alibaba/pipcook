import {IMAGE_CLASSIFICATION, OBJECT_DETECTION, TEXT_CLASSIFICATION} from './model';

describe('model constant', () => {
  it('should own some constants', () => {
    expect(IMAGE_CLASSIFICATION).toEqual('image classification');
    expect(OBJECT_DETECTION).toEqual('object detection');
    expect(TEXT_CLASSIFICATION).toEqual('text classification');
  });
});
