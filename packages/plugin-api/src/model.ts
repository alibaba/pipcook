import * as fs from 'fs-extra';
import * as path from 'path';

const boa = require('@pipcook/boa');
const cv2 = boa.import('cv2');


export async function gray(src: string, dest: string) {
  fs.ensureDirSync(dest);
  const image = cv2.imread(src);
  const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
  cv2.imwrite(path.join(dest, path.basename(src)), gray);
}
