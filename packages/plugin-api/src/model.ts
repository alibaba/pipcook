const boa = require('@pipcook/boa');

export function gray(src: string, dest: string) {
  const cv2 = boa.import('cv2');
  const image = cv2.imread(src);
  const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
  cv2.imwrite(dest, gray);
}