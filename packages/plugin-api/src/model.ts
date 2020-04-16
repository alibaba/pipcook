import * as fs from 'fs-extra';
import * as path from 'path';

const boa = require('@pipcook/boa');
const cv2 = boa.import('cv2');
const { word_tokenize } = boa.import('nltk.tokenize');
const nltk = boa.import('nltk');

export function gray(src: string, dest: string) {
  fs.ensureDirSync(dest);
  const image = cv2.imread(src);
  const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
  cv2.imwrite(path.join(dest, path.basename(src)), gray);
}

export function resize(src: string, dest: string, dim: number[]) {
  fs.ensureDirSync(dest);
  const image = cv2.imread(src);
  const resized = cv2.resize(image, dim);
  cv2.imwrite(path.join(dest, path.basename(src)), resized);
}

export function tokenize(sentence: string) {
  nltk.download('punkt');
  return word_tokenize(sentence);
}
